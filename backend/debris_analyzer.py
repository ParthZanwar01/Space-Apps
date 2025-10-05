import cv2
import numpy as np
from PIL import Image
import json
from typing import Dict, List, Tuple, Any
import logging

logger = logging.getLogger(__name__)

class DebrisAnalyzer:
    def __init__(self):
        self.min_feasible_size = 0.1  # meters
        self.max_feasible_size = 10.0  # meters
        self.melting_temperature_ranges = {
            'aluminum': (660, 660),
            'steel': (1370, 1538),
            'titanium': (1668, 1668),
            'plastic': (120, 200),
            'composite': (200, 400),
            'carbon_fiber': (300, 400),
            'white_paint': (100, 150),
            'unknown': (500, 1000)
        }
        
    def analyze_image(self, image: np.ndarray) -> Dict[str, Any]:
        """
        Analyze space debris image and determine feasibility for capture and melting
        """
        try:
            # Convert to grayscale for processing
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
            
            # Detect debris objects
            debris_objects = self._detect_debris_objects(gray)
            
            # Analyze each detected object
            analysis_results = []
            for i, obj in enumerate(debris_objects):
                analysis = self._analyze_single_debris(obj, image, i)
                analysis_results.append(analysis)
            
            # Filter feasible debris
            feasible_debris = [obj for obj in analysis_results if obj['feasible']]
            
            return {
                'total_objects': int(len(debris_objects)),
                'feasible_objects': int(len(feasible_debris)),
                'debris_analysis': analysis_results,
                'feasible_debris': feasible_debris,
                'summary': self._generate_summary(analysis_results)
            }
            
        except Exception as e:
            logger.error(f"Error in debris analysis: {str(e)}")
            return {'error': str(e)}
    
    def _detect_debris_objects(self, gray_image: np.ndarray) -> List[Dict]:
        """Detect debris objects using multi-scale analysis and advanced filtering"""
        debris_objects = []
        
        # Multi-scale analysis for different debris sizes
        scales = [1.0, 0.8, 1.2, 0.6, 1.4]
        
        for scale in scales:
            # Resize image for multi-scale detection
            if scale != 1.0:
                h, w = gray_image.shape
                new_h, new_w = int(h * scale), int(w * scale)
                scaled_image = cv2.resize(gray_image, (new_w, new_h))
            else:
                scaled_image = gray_image.copy()
            
            # Method 1: Enhanced edge detection with multiple thresholds
            edges1 = cv2.Canny(scaled_image, 30, 100)
            edges2 = cv2.Canny(scaled_image, 50, 150)
            edges3 = cv2.Canny(scaled_image, 80, 200)
            edges_combined = cv2.bitwise_or(cv2.bitwise_or(edges1, edges2), edges3)
            
            # Method 2: Multi-level adaptive thresholding
            adaptive1 = cv2.adaptiveThreshold(scaled_image, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 11, 2)
            adaptive2 = cv2.adaptiveThreshold(scaled_image, 255, cv2.ADAPTIVE_THRESH_MEAN_C, cv2.THRESH_BINARY, 15, 3)
            adaptive_combined = cv2.bitwise_or(adaptive1, adaptive2)
            
            # Method 3: Laplacian edge detection for fine details
            laplacian = cv2.Laplacian(scaled_image, cv2.CV_64F)
            laplacian = np.uint8(np.absolute(laplacian))
            laplacian_thresh = cv2.threshold(laplacian, 20, 255, cv2.THRESH_BINARY)[1]
            
            # Method 4: Morphological operations with multiple kernels
            kernel_small = np.ones((3,3), np.uint8)
            kernel_medium = np.ones((5,5), np.uint8)
            
            morph1 = cv2.morphologyEx(adaptive_combined, cv2.MORPH_CLOSE, kernel_small)
            morph2 = cv2.morphologyEx(edges_combined, cv2.MORPH_CLOSE, kernel_medium)
            morph_combined = cv2.bitwise_or(morph1, morph2)
            
            # Combine all detection methods
            final_combined = cv2.bitwise_or(
                cv2.bitwise_or(edges_combined, adaptive_combined),
                cv2.bitwise_or(laplacian_thresh, morph_combined)
            )
            
            # Find contours with hierarchy
            contours, hierarchy = cv2.findContours(final_combined, cv2.RETR_TREE, cv2.CHAIN_APPROX_SIMPLE)
            
            # Advanced filtering and analysis
            for i, contour in enumerate(contours):
                # Skip if contour is child of another (nested objects)
                if hierarchy[0][i][3] != -1:
                    continue
                
                area = cv2.contourArea(contour)
                
                # Dynamic area filtering based on image size and scale
                min_area = max(20, int(50 * scale))
                max_area = int((scaled_image.shape[0] * scaled_image.shape[1] * 0.25) / scale)
                
                if min_area < area < max_area:
                    x, y, w, h = cv2.boundingRect(contour)
                    
                    # Enhanced aspect ratio check
                    aspect_ratio = w / h if h > 0 else 0
                    if not (0.1 < aspect_ratio < 10.0):
                        continue
                    
                    # Calculate advanced geometric properties
                    perimeter = cv2.arcLength(contour, True)
                    if perimeter == 0:
                        continue
                        
                        circularity = 4 * np.pi * area / (perimeter * perimeter)
                    rectangularity = area / (w * h) if w * h > 0 else 0
                    
                    # Convexity analysis
                    hull = cv2.convexHull(contour)
                    hull_area = cv2.contourArea(hull)
                    convexity = area / hull_area if hull_area > 0 else 0
                    
                    # Solidity (ratio of contour area to convex hull area)
                    solidity = area / hull_area if hull_area > 0 else 0
                    
                    # Advanced position filtering
                    margin = min(scaled_image.shape[0], scaled_image.shape[1]) * 0.15
                    if (x < margin or y < margin or 
                        x + w > scaled_image.shape[1] - margin or 
                        y + h > scaled_image.shape[0] - margin):
                        continue
                    
                    # Calculate confidence score based on multiple factors
                    confidence = self._calculate_detection_confidence(
                        area, circularity, rectangularity, convexity, solidity, aspect_ratio
                    )
                    
                    # Scale back coordinates to original image size
                    if scale != 1.0:
                        x = int(x / scale)
                        y = int(y / scale)
                        w = int(w / scale)
                        h = int(h / scale)
                        area = area / (scale * scale)
                        perimeter = perimeter / scale
                    
                    # Only include high-confidence detections
                    if confidence > 0.3:
                        debris_objects.append({
                            'contour': contour,
                            'bbox': (x, y, w, h),
                            'area': area,
                            'perimeter': perimeter,
                            'circularity': circularity,
                            'rectangularity': rectangularity,
                            'convexity': convexity,
                            'solidity': solidity,
                            'center': (x + w//2, y + h//2),
                            'confidence': confidence,
                            'scale': scale
                        })
        
        # Remove duplicates and merge overlapping detections
        debris_objects = self._remove_duplicates(debris_objects)
        
        # If we still don't have enough objects, try blob detection
        if len(debris_objects) < 3:
            debris_objects.extend(self._detect_dense_debris(gray_image))
        
        # Sort by confidence and return top detections
        debris_objects.sort(key=lambda x: x['confidence'], reverse=True)
        return debris_objects[:20]  # Limit to top 20 detections
    
    def _calculate_detection_confidence(self, area, circularity, rectangularity, convexity, solidity, aspect_ratio):
        """Calculate confidence score for debris detection"""
        # Normalize features to 0-1 range
        area_score = min(1.0, area / 1000)  # Prefer medium-sized objects
        circularity_score = min(1.0, circularity)  # Higher circularity is better
        rectangularity_score = min(1.0, rectangularity)  # Higher rectangularity is better
        convexity_score = min(1.0, convexity)  # Higher convexity is better
        solidity_score = min(1.0, solidity)  # Higher solidity is better
        
        # Aspect ratio score (prefer objects closer to square)
        aspect_score = 1.0 - abs(1.0 - aspect_ratio) / 5.0
        aspect_score = max(0.0, min(1.0, aspect_score))
        
        # Weighted combination
        confidence = (
            area_score * 0.15 +
            circularity_score * 0.20 +
            rectangularity_score * 0.15 +
            convexity_score * 0.15 +
            solidity_score * 0.20 +
            aspect_score * 0.15
        )
        
        return confidence
    
    def _remove_duplicates(self, debris_objects):
        """Remove overlapping detections using IoU threshold"""
        if len(debris_objects) <= 1:
            return debris_objects
        
        # Sort by confidence (highest first)
        debris_objects.sort(key=lambda x: x['confidence'], reverse=True)
        
        filtered_objects = []
        for obj in debris_objects:
            is_duplicate = False
            x1, y1, w1, h1 = obj['bbox']
            
            for existing_obj in filtered_objects:
                x2, y2, w2, h2 = existing_obj['bbox']
                
                # Calculate IoU (Intersection over Union)
                iou = self._calculate_iou((x1, y1, w1, h1), (x2, y2, w2, h2))
                
                if iou > 0.3:  # 30% overlap threshold
                    is_duplicate = True
                    break
            
            if not is_duplicate:
                filtered_objects.append(obj)
        
        return filtered_objects
    
    def _calculate_iou(self, box1, box2):
        """Calculate Intersection over Union (IoU) of two bounding boxes"""
        x1, y1, w1, h1 = box1
        x2, y2, w2, h2 = box2
        
        # Calculate intersection
        xi1 = max(x1, x2)
        yi1 = max(y1, y2)
        xi2 = min(x1 + w1, x2 + w2)
        yi2 = min(y1 + h1, y2 + h2)
        
        if xi2 <= xi1 or yi2 <= yi1:
            return 0.0
        
        intersection = (xi2 - xi1) * (yi2 - yi1)
        union = w1 * h1 + w2 * h2 - intersection
        
        return intersection / union if union > 0 else 0.0
    
    def _detect_dense_debris(self, gray_image: np.ndarray) -> List[Dict]:
        """Detect dense debris fields using blob detection"""
        debris_objects = []
        
        # Use blob detection for small objects
        params = cv2.SimpleBlobDetector_Params()
        
        # Filter by area
        params.filterByArea = True
        params.minArea = 20
        params.maxArea = 1000
        
        # Filter by circularity
        params.filterByCircularity = True
        params.minCircularity = 0.3
        
        # Filter by convexity
        params.filterByConvexity = True
        params.minConvexity = 0.5
        
        # Filter by inertia ratio
        params.filterByInertia = True
        params.minInertiaRatio = 0.3
        
        # Create detector
        detector = cv2.SimpleBlobDetector_create(params)
        
        # Detect blobs
        keypoints = detector.detect(gray_image)
        
        for i, kp in enumerate(keypoints):
            x, y = int(kp.pt[0]), int(kp.pt[1])
            size = kp.size
            
            # Create bounding box around blob
            w = h = int(size * 1.5)  # Slightly larger than blob
            x = max(0, x - w//2)
            y = max(0, y - h//2)
            
            # Ensure bbox is within image bounds
            w = min(w, gray_image.shape[1] - x)
            h = min(h, gray_image.shape[0] - y)
            
            if w > 0 and h > 0:
                debris_objects.append({
                    'contour': None,  # Blob detection doesn't provide contours
                    'bbox': (x, y, w, h),
                    'area': w * h,
                    'perimeter': 2 * (w + h),
                    'circularity': 0.8,  # Assume high circularity for blobs
                    'center': (x + w//2, y + h//2),
                    'detection_method': 'blob',
                    'confidence': 0.6  # Default confidence for blob detection
                })
        
        return debris_objects
    
    def _analyze_single_debris(self, obj: Dict, original_image: np.ndarray, index: int) -> Dict[str, Any]:
        """Analyze a single debris object"""
        x, y, w, h = obj['bbox']
        
        # Extract region of interest
        roi = original_image[y:y+h, x:x+w]
        
        # Estimate size (assuming known camera parameters)
        estimated_size = self._estimate_size(obj['area'])
        
        # Classify material with advanced analysis
        material_analysis = self._classify_material(roi)
        material = material_analysis['material']
        material_confidence = material_analysis['confidence']
        material_features = material_analysis['features']
        
        # Calculate melting feasibility
        melting_feasibility = self._calculate_melting_feasibility(material, estimated_size)
        
        # Determine overall feasibility
        feasible = self._determine_feasibility(estimated_size, material, melting_feasibility)
        
        # Calculate priority score
        priority = self._calculate_priority(estimated_size, material, melting_feasibility)
        
        # Calculate overall confidence score
        detection_confidence = obj.get('confidence', 0.5)
        overall_confidence = (detection_confidence * 0.6 + material_confidence * 0.4)
        
        return {
            'id': int(index),
            'bbox': [int(x) for x in obj['bbox']],
            'center': [int(x) for x in obj['center']],
            'estimated_size': float(estimated_size),
            'material': str(material),
            'material_confidence': float(material_confidence),
            'detection_confidence': float(detection_confidence),
            'overall_confidence': float(overall_confidence),
            'material_features': material_features,
            'melting_feasibility': {
                'material': str(melting_feasibility['material']),
                'melting_temperature': float(melting_feasibility['melting_temperature']),
                'estimated_mass': float(melting_feasibility['estimated_mass']),
                'melting_energy': float(melting_feasibility['melting_energy']),
                'feasibility_score': float(melting_feasibility['feasibility_score']),
                'feasible': bool(melting_feasibility['feasible'])
            },
            'feasible': bool(feasible),
            'priority': float(priority),
            'area': float(obj['area']),
            'circularity': float(obj.get('circularity', 0)),
            'rectangularity': float(obj.get('rectangularity', 0)),
            'convexity': float(obj.get('convexity', 0)),
            'solidity': float(obj.get('solidity', 0))
        }
    
    def _estimate_size(self, area: float) -> float:
        """Estimate real-world size based on pixel area (improved model)"""
        # Improved estimation for space debris
        # Space debris typically ranges from 1cm to several meters
        # Assuming varying pixel-to-meter ratios based on object size
        
        if area < 100:  # Small objects (likely close debris)
            pixel_to_meter_ratio = 0.005  # 5mm per pixel
        elif area < 1000:  # Medium objects
            pixel_to_meter_ratio = 0.01   # 1cm per pixel
        else:  # Large objects (likely distant or large debris)
            pixel_to_meter_ratio = 0.02   # 2cm per pixel
        
        estimated_diameter = np.sqrt(area * pixel_to_meter_ratio * pixel_to_meter_ratio / np.pi) * 2
        return max(0.01, min(estimated_diameter, 15.0))  # Clamp between 1cm and 15m
    
    def _classify_material(self, roi: np.ndarray) -> Dict[str, Any]:
        """Classify material based on advanced color, texture, and spectral analysis"""
        if roi.size == 0:
            return {'material': 'unknown', 'confidence': 0.0, 'features': {}}
        
        # Convert to different color spaces for comprehensive analysis
        hsv = cv2.cvtColor(roi, cv2.COLOR_BGR2HSV)
        lab = cv2.cvtColor(roi, cv2.COLOR_BGR2LAB)
        gray = cv2.cvtColor(roi, cv2.COLOR_BGR2GRAY)
        
        # Calculate comprehensive color statistics
        mean_bgr = np.mean(roi, axis=(0, 1))
        mean_hsv = np.mean(hsv, axis=(0, 1))
        mean_lab = np.mean(lab, axis=(0, 1))
        
        std_bgr = np.std(roi, axis=(0, 1))
        std_hsv = np.std(hsv, axis=(0, 1))
        std_lab = np.std(lab, axis=(0, 1))
        
        # Advanced texture analysis using Local Binary Patterns
        texture_features = self._calculate_texture_features(gray)
        
        # Spectral analysis
        spectral_features = self._calculate_spectral_features(roi)
        
        # Geometric properties
        geometric_features = self._calculate_geometric_features(roi)
        
        # Calculate brightness and contrast with multiple methods
        brightness = np.mean(mean_bgr)
        contrast = np.mean(std_bgr)
        brightness_std = np.std(mean_bgr)
        
        # Advanced material classification using weighted scoring
        material_scores = self._calculate_material_scores(
            mean_bgr, mean_hsv, mean_lab, std_bgr, std_hsv, std_lab,
            brightness, contrast, brightness_std, texture_features,
            spectral_features, geometric_features
        )
        
        # Get best material and confidence
        best_material = max(material_scores, key=material_scores.get)
        confidence = material_scores[best_material]
        
        return {
            'material': best_material,
            'confidence': confidence,
            'features': {
                'brightness': float(brightness),
                'contrast': float(contrast),
                'saturation': float(mean_hsv[1]),
                'hue': float(mean_hsv[0]),
                'texture_complexity': float(texture_features['complexity']),
                'spectral_uniformity': float(spectral_features['uniformity']),
                'all_scores': {k: float(v) for k, v in material_scores.items()}
            }
        }
    
    def _calculate_texture_features(self, gray_image: np.ndarray) -> Dict[str, float]:
        """Calculate texture features using Local Binary Patterns and Gabor filters"""
        features = {}
        
        # Local Binary Pattern for texture analysis
        from skimage.feature import local_binary_pattern
        
        # Calculate LBP
        radius = 1
        n_points = 8 * radius
        lbp = local_binary_pattern(gray_image, n_points, radius, method='uniform')
        
        # Calculate LBP histogram
        hist, _ = np.histogram(lbp.ravel(), bins=n_points + 2, range=(0, n_points + 2))
        hist = hist.astype(float)
        hist /= (hist.sum() + 1e-7)
        
        # Texture complexity (entropy of LBP histogram)
        features['complexity'] = -np.sum(hist * np.log(hist + 1e-7))
        
        # Texture uniformity
        features['uniformity'] = np.sum(hist ** 2)
        
        # Gabor filter response for directional texture
        from skimage.filters import gabor
        
        # Apply Gabor filter
        filtered_real, filtered_imag = gabor(gray_image, frequency=0.1)
        gabor_response = np.sqrt(filtered_real**2 + filtered_imag**2)
        features['gabor_response'] = float(np.mean(gabor_response))
        
        return features
    
    def _calculate_spectral_features(self, roi: np.ndarray) -> Dict[str, float]:
        """Calculate spectral features for material analysis"""
        features = {}
        
        # Convert to grayscale for spectral analysis
        gray = cv2.cvtColor(roi, cv2.COLOR_BGR2GRAY)
        
        # Calculate power spectral density
        f_transform = np.fft.fft2(gray)
        f_shift = np.fft.fftshift(f_transform)
        magnitude_spectrum = np.log(np.abs(f_shift) + 1)
        
        # Spectral features
        features['spectral_energy'] = float(np.sum(magnitude_spectrum))
        features['spectral_centroid'] = float(np.mean(magnitude_spectrum))
        features['spectral_spread'] = float(np.std(magnitude_spectrum))
        features['uniformity'] = float(1.0 / (1.0 + np.std(magnitude_spectrum)))
        
        return features
    
    def _calculate_geometric_features(self, roi: np.ndarray) -> Dict[str, float]:
        """Calculate geometric features for material classification"""
        features = {}
        
        # Convert to grayscale
        gray = cv2.cvtColor(roi, cv2.COLOR_BGR2GRAY)
        
        # Edge density
        edges = cv2.Canny(gray, 50, 150)
        features['edge_density'] = float(np.sum(edges > 0) / edges.size)
        
        # Gradient magnitude
        grad_x = cv2.Sobel(gray, cv2.CV_64F, 1, 0, ksize=3)
        grad_y = cv2.Sobel(gray, cv2.CV_64F, 0, 1, ksize=3)
        gradient_magnitude = np.sqrt(grad_x**2 + grad_y**2)
        features['gradient_strength'] = float(np.mean(gradient_magnitude))
        
        return features
    
    def _calculate_material_scores(self, mean_bgr, mean_hsv, mean_lab, std_bgr, std_hsv, std_lab,
                                 brightness, contrast, brightness_std, texture_features,
                                 spectral_features, geometric_features) -> Dict[str, float]:
        """Calculate material classification scores using advanced features"""
        
        scores = {}
        
        # Aluminum: Very bright, low saturation, low contrast, high uniformity
        aluminum_score = 0.0
        if brightness > 160 and mean_hsv[1] < 40:
            aluminum_score += 0.3
        if contrast < 40:
            aluminum_score += 0.2
        if spectral_features['uniformity'] > 0.7:
            aluminum_score += 0.2
        if texture_features['complexity'] < 2.0:
            aluminum_score += 0.2
        if brightness_std < 30:
            aluminum_score += 0.1
        scores['aluminum'] = min(1.0, aluminum_score)
        
        # Steel: Medium brightness, low saturation, moderate contrast
        steel_score = 0.0
        if 100 < brightness < 180 and mean_hsv[1] < 60:
            steel_score += 0.3
        if 20 < contrast < 60:
            steel_score += 0.2
        if 0.4 < spectral_features['uniformity'] < 0.8:
            steel_score += 0.2
        if 1.5 < texture_features['complexity'] < 3.0:
            steel_score += 0.2
        if geometric_features['edge_density'] > 0.1:
            steel_score += 0.1
        scores['steel'] = min(1.0, steel_score)
        
        # Titanium: Blue-ish hue, bright, moderate contrast
        titanium_score = 0.0
        if 100 < mean_hsv[0] < 130 and brightness > 120:
            titanium_score += 0.3
        if 30 < contrast < 70:
            titanium_score += 0.2
        if mean_lab[2] > 0:  # Positive b* (blue-yellow axis)
            titanium_score += 0.2
        if 0.3 < spectral_features['uniformity'] < 0.7:
            titanium_score += 0.2
        if texture_features['complexity'] > 2.0:
            titanium_score += 0.1
        scores['titanium'] = min(1.0, titanium_score)
        
        # Plastic: Bright, colorful, high contrast, high texture complexity
        plastic_score = 0.0
        if brightness > 140 and mean_hsv[1] > 40:
            plastic_score += 0.3
        if contrast > 50:
            plastic_score += 0.2
        if texture_features['complexity'] > 2.5:
            plastic_score += 0.2
        if spectral_features['spectral_energy'] > 1000:
            plastic_score += 0.2
        if geometric_features['gradient_strength'] > 20:
            plastic_score += 0.1
        scores['plastic'] = min(1.0, plastic_score)
        
        # Composite: High saturation, textured, moderate brightness
        composite_score = 0.0
        if mean_hsv[1] > 60 and 80 < brightness < 160:
            composite_score += 0.3
        if texture_features['complexity'] > 2.0:
            composite_score += 0.2
        if contrast > 40:
            composite_score += 0.2
        if geometric_features['edge_density'] > 0.15:
            composite_score += 0.2
        if spectral_features['spectral_spread'] > 50:
            composite_score += 0.1
        scores['composite'] = min(1.0, composite_score)
        
        # Carbon Fiber: Dark, low contrast, high uniformity
        carbon_fiber_score = 0.0
        if brightness < 100 and contrast < 30:
            carbon_fiber_score += 0.3
        if spectral_features['uniformity'] > 0.8:
            carbon_fiber_score += 0.2
        if texture_features['complexity'] < 1.5:
            carbon_fiber_score += 0.2
        if mean_hsv[1] < 30:
            carbon_fiber_score += 0.2
        if geometric_features['gradient_strength'] < 15:
            carbon_fiber_score += 0.1
        scores['carbon_fiber'] = min(1.0, carbon_fiber_score)
        
        # White Paint: Very bright, very low contrast, high uniformity
        white_paint_score = 0.0
        if brightness > 200 and contrast < 25:
            white_paint_score += 0.3
        if spectral_features['uniformity'] > 0.9:
            white_paint_score += 0.2
        if texture_features['complexity'] < 1.0:
            white_paint_score += 0.2
        if mean_hsv[1] < 20:
            white_paint_score += 0.2
        if brightness_std < 20:
            white_paint_score += 0.1
        scores['white_paint'] = min(1.0, white_paint_score)
        
        # Unknown: Default for low confidence classifications
        max_score = max(scores.values()) if scores else 0
        scores['unknown'] = max(0.1, 1.0 - max_score)
        
        return scores
    
    def _calculate_melting_feasibility(self, material: str, size: float) -> Dict[str, Any]:
        """Calculate feasibility of melting the debris"""
        temp_range = self.melting_temperature_ranges.get(material, self.melting_temperature_ranges['unknown'])
        
        # Energy required (simplified calculation)
        # Assuming spherical debris with density based on material
        densities = {
            'aluminum': 2700,  # kg/m³
            'steel': 7850,
            'titanium': 4500,
            'plastic': 1000,
            'composite': 1500,
            'carbon_fiber': 1600,
            'white_paint': 1200,
            'unknown': 2000
        }
        
        density = densities.get(material, 2000)
        volume = (4/3) * np.pi * (size/2)**3
        mass = density * volume
        
        # Melting energy (simplified)
        specific_heat = 500  # J/kg·K (average)
        melting_energy = mass * specific_heat * (temp_range[0] - 273)  # Assuming 0°C initial temp
        
        # Feasibility score (0-1, higher is better)
        max_feasible_energy = 1e6  # 1 MJ limit
        feasibility_score = max(0, 1 - (melting_energy / max_feasible_energy))
        
        return {
            'material': material,
            'melting_temperature': temp_range[0],
            'estimated_mass': mass,
            'melting_energy': melting_energy,
            'feasibility_score': feasibility_score,
            'feasible': feasibility_score > 0.1  # Lower threshold
        }
    
    def _determine_feasibility(self, size: float, material: str, melting_feasibility: Dict) -> bool:
        """Determine overall feasibility for capture and melting (more permissive)"""
        # Size constraints (more permissive)
        size_feasible = 0.01 <= size <= 50.0  # Much wider range
        
        # Melting feasibility (more permissive)
        melting_feasible = melting_feasibility['feasibility_score'] > 0.1  # Lower threshold
        
        # Material feasibility (accept all materials for demo)
        material_feasible = True
        
        # At least 2 out of 3 criteria must be met
        criteria_met = sum([size_feasible, melting_feasible, material_feasible])
        return criteria_met >= 2
    
    def _calculate_priority(self, size: float, material: str, melting_feasibility: Dict) -> float:
        """Calculate priority score for debris capture (0-1, higher is better)"""
        # Size factor (medium sizes are preferred)
        optimal_size = 2.0  # meters
        size_factor = 1 - abs(size - optimal_size) / optimal_size
        size_factor = max(0, min(1, size_factor))
        
        # Material factor
        material_priorities = {
            'aluminum': 0.9,
            'steel': 0.7,
            'titanium': 0.8,
            'plastic': 0.6,
            'composite': 0.5,
            'carbon_fiber': 0.7,
            'white_paint': 0.4,
            'unknown': 0.3
        }
        material_factor = material_priorities.get(material, 0.3)
        
        # Melting feasibility factor
        melting_factor = melting_feasibility['feasibility_score']
        
        # Combined priority
        priority = (size_factor * 0.3 + material_factor * 0.4 + melting_factor * 0.3)
        return max(0, min(1, priority))
    
    def _generate_summary(self, analysis_results: List[Dict]) -> Dict[str, Any]:
        """Generate summary statistics"""
        if not analysis_results:
            return {'total': 0, 'feasible': 0, 'avg_priority': 0}
        
        feasible_count = sum(1 for obj in analysis_results if obj['feasible'])
        avg_priority = np.mean([obj['priority'] for obj in analysis_results])
        
        # Material distribution
        materials = [obj['material'] for obj in analysis_results]
        material_counts = {mat: materials.count(mat) for mat in set(materials)}
        
        # Size statistics
        sizes = [obj['estimated_size'] for obj in analysis_results]
        
        return {
            'total': int(len(analysis_results)),
            'feasible': int(feasible_count),
            'feasibility_rate': float(feasible_count / len(analysis_results) if analysis_results else 0),
            'avg_priority': float(avg_priority),
            'material_distribution': material_counts,
            'size_stats': {
                'min': float(min(sizes) if sizes else 0),
                'max': float(max(sizes) if sizes else 0),
                'avg': float(np.mean(sizes) if sizes else 0)
            }
        }
    
    def create_visualization(self, image: np.ndarray, analysis: Dict) -> np.ndarray:
        """Create visualization of analysis results"""
        vis_image = image.copy()
        
        if 'debris_analysis' not in analysis:
            return vis_image
        
        for obj in analysis['debris_analysis']:
            x, y, w, h = obj['bbox']
            
            # Choose color based on feasibility
            if obj['feasible']:
                color = (0, 255, 0)  # Green for feasible
            else:
                color = (0, 0, 255)  # Red for not feasible
            
            # Draw bounding box
            cv2.rectangle(vis_image, (x, y), (x + w, y + h), color, 2)
            
            # Add label
            label = f"ID:{obj['id']} {obj['material'][:3]} {obj['estimated_size']:.2f}m"
            cv2.putText(vis_image, label, (x, y - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 1)
            
            # Add priority score
            priority_text = f"P:{obj['priority']:.2f}"
            cv2.putText(vis_image, priority_text, (x, y + h + 20), cv2.FONT_HERSHEY_SIMPLEX, 0.4, color, 1)
        
        return vis_image

    def analyze_image_from_path(self, image_path: str) -> Dict[str, Any]:
        """
        Analyze an image from file path for space debris detection and feasibility assessment.
        
        Args:
            image_path: Path to image file
            
        Returns:
            dict: Analysis results including detected objects, feasibility scores, and recommendations
        """
        try:
            # Read and preprocess the image
            image = cv2.imread(image_path)
            
            if image is None:
                return {'error': f'Could not read image from path: {image_path}'}
            
            # Use the existing analyze_image method
            return self.analyze_image(image)
            
        except Exception as e:
            logger.error(f"Error in debris analysis from path: {str(e)}")
            return {'error': str(e)}
