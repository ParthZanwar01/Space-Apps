import numpy as np
import json
from typing import List, Dict, Tuple, Any
import logging
from scipy.spatial.distance import cdist
from scipy.optimize import minimize
import math

logger = logging.getLogger(__name__)

class PathPlanner:
    def __init__(self):
        self.max_velocity = 1000.0  # m/s (typical spacecraft velocity)
        self.max_acceleration = 10.0  # m/s²
        self.fuel_efficiency = 0.1  # kg fuel per m/s delta-v
        self.max_mission_time = 3600 * 24  # 24 hours in seconds
        self.safety_distance = 100.0  # meters minimum distance between objects
        
    def plan_optimal_path(self, debris_list: List[Dict], start_position: List[float] = [0, 0, 0]) -> Dict[str, Any]:
        """
        Plan optimal path for capturing multiple debris objects
        """
        try:
            if not debris_list:
                return {'error': 'No debris objects provided'}
            
            # Filter feasible debris
            feasible_debris = [d for d in debris_list if d.get('feasible', False)]
            
            if not feasible_debris:
                return {
                    'path': [],
                    'total_distance': 0,
                    'total_time': 0,
                    'total_fuel': 0,
                    'message': 'No feasible debris objects found'
                }
            
            # Sort by priority (highest first)
            feasible_debris.sort(key=lambda x: x.get('priority', 0), reverse=True)
            
            # Plan path using multiple algorithms
            greedy_path = self._plan_greedy_path(feasible_debris, start_position)
            optimized_path = self._optimize_path(greedy_path, start_position)
            
            # Calculate path metrics
            metrics = self._calculate_path_metrics(optimized_path, start_position)
            
            # Generate 3D visualization data
            visualization_data = self._generate_visualization_data(optimized_path, start_position)
            
            return {
                'path': optimized_path,
                'metrics': metrics,
                'visualization': visualization_data,
                'algorithm_used': 'greedy_with_optimization',
                'total_debris': len(feasible_debris),
                'path_length': len(optimized_path)
            }
            
        except Exception as e:
            logger.error(f"Error in path planning: {str(e)}")
            return {'error': f'Path planning failed: {str(e)}'}
    
    def _plan_greedy_path(self, debris_list: List[Dict], start_position: List[float]) -> List[Dict]:
        """Plan path using greedy algorithm (nearest neighbor)"""
        path = []
        remaining_debris = debris_list.copy()
        current_position = np.array(start_position)
        
        while remaining_debris:
            # Find nearest feasible debris
            best_debris = None
            best_distance = float('inf')
            best_index = -1
            
            for i, debris in enumerate(remaining_debris):
                center = debris.get('center', [0, 0, 0])
                # Ensure center is 3D
                if len(center) == 2:
                    center = center + [0]  # Add z=0 for 2D coordinates
                debris_pos = np.array(center)
                distance = np.linalg.norm(debris_pos - current_position)
                
                if distance < best_distance:
                    best_distance = distance
                    best_debris = debris
                    best_index = i
            
            if best_debris is not None:
                # Add to path
                center = best_debris.get('center', [0, 0, 0])
                # Ensure center is 3D
                if len(center) == 2:
                    center = center + [0]  # Add z=0 for 2D coordinates
                
                path_entry = {
                    'debris_id': best_debris.get('id', len(path)),
                    'position': center,
                    'debris_data': best_debris,
                    'distance_from_previous': best_distance,
                    'step': len(path)
                }
                path.append(path_entry)
                
                # Update current position and remove from remaining
                current_position = np.array(center)
                remaining_debris.pop(best_index)
            else:
                break
        
        return path
    
    def _optimize_path(self, initial_path: List[Dict], start_position: List[float]) -> List[Dict]:
        """Optimize path using local search algorithms"""
        if len(initial_path) <= 2:
            return initial_path
        
        # Try 2-opt optimization for better path
        optimized_path = self._two_opt_optimization(initial_path, start_position)
        
        return optimized_path
    
    def _two_opt_optimization(self, path: List[Dict], start_position: List[float]) -> List[Dict]:
        """Apply 2-opt optimization to improve path"""
        best_path = path.copy()
        best_distance = self._calculate_total_distance(path, start_position)
        improved = True
        
        while improved:
            improved = False
            for i in range(1, len(best_path) - 1):
                for j in range(i + 1, len(best_path)):
                    # Try reversing segment between i and j
                    new_path = best_path[:i] + best_path[i:j+1][::-1] + best_path[j+1:]
                    new_distance = self._calculate_total_distance(new_path, start_position)
                    
                    if new_distance < best_distance:
                        best_path = new_path
                        best_distance = new_distance
                        improved = True
        
        return best_path
    
    def _calculate_total_distance(self, path: List[Dict], start_position: List[float]) -> float:
        """Calculate total distance of path"""
        if not path:
            return 0
        
        total_distance = 0
        current_pos = np.array(start_position)
        
        for step in path:
            step_pos = np.array(step['position'])
            total_distance += np.linalg.norm(step_pos - current_pos)
            current_pos = step_pos
        
        return total_distance
    
    def _calculate_path_metrics(self, path: List[Dict], start_position: List[float]) -> Dict[str, Any]:
        """Calculate comprehensive path metrics"""
        if not path:
            return {
                'total_distance': 0,
                'total_time': 0,
                'total_fuel': 0,
                'efficiency': 0,
                'safety_score': 1.0
            }
        
        # Calculate distances and times
        total_distance = self._calculate_total_distance(path, start_position)
        total_time = self._calculate_total_time(path, start_position)
        total_fuel = self._calculate_total_fuel(path, start_position)
        
        # Calculate efficiency metrics
        efficiency = self._calculate_efficiency(path)
        safety_score = self._calculate_safety_score(path)
        
        # Calculate priority-weighted metrics
        priority_score = sum(step['debris_data'].get('priority', 0) for step in path)
        
        return {
            'total_distance': total_distance,
            'total_time': total_time,
            'total_fuel': total_fuel,
            'efficiency': efficiency,
            'safety_score': safety_score,
            'priority_score': priority_score,
            'avg_distance_per_step': total_distance / len(path) if path else 0,
            'fuel_per_km': total_fuel / (total_distance / 1000) if total_distance > 0 else 0
        }
    
    def _calculate_total_time(self, path: List[Dict], start_position: List[float]) -> float:
        """Calculate total mission time"""
        if not path:
            return 0
        
        total_time = 0
        current_pos = np.array(start_position)
        
        for step in path:
            step_pos = np.array(step['position'])
            distance = np.linalg.norm(step_pos - current_pos)
            
            # Time includes travel time and capture time
            travel_time = distance / self.max_velocity
            capture_time = 300  # 5 minutes per capture
            total_time += travel_time + capture_time
            
            current_pos = step_pos
        
        return total_time
    
    def _calculate_total_fuel(self, path: List[Dict], start_position: List[float]) -> float:
        """Calculate total fuel consumption"""
        if not path:
            return 0
        
        total_fuel = 0
        current_pos = np.array(start_position)
        
        for step in path:
            step_pos = np.array(step['position'])
            distance = np.linalg.norm(step_pos - current_pos)
            
            # Fuel for acceleration and deceleration
            delta_v = 2 * np.sqrt(distance * self.max_acceleration)  # Simplified
            fuel = delta_v * self.fuel_efficiency
            total_fuel += fuel
            
            current_pos = step_pos
        
        return total_fuel
    
    def _calculate_efficiency(self, path: List[Dict]) -> float:
        """Calculate path efficiency (0-1, higher is better)"""
        if not path:
            return 0
        
        # Efficiency based on priority-to-distance ratio
        total_priority = sum(step['debris_data'].get('priority', 0) for step in path)
        total_distance = sum(step.get('distance_from_previous', 0) for step in path)
        
        if total_distance == 0:
            return 1.0
        
        # Normalize efficiency (higher priority, shorter distance = better)
        efficiency = total_priority / (total_distance / 1000)  # Priority per km
        return min(1.0, efficiency / 10.0)  # Normalize to 0-1
    
    def _calculate_safety_score(self, path: List[Dict]) -> float:
        """Calculate safety score for the path (0-1, higher is better)"""
        if len(path) <= 1:
            return 1.0
        
        # Check for potential collisions and dangerous maneuvers
        safety_violations = 0
        total_checks = 0
        
        for i in range(len(path) - 1):
            for j in range(i + 2, len(path)):
                # Check if path segments are too close
                pos1 = np.array(path[i]['position'])
                pos2 = np.array(path[i+1]['position'])
                pos3 = np.array(path[j]['position'])
                
                # Calculate minimum distance between path segments
                min_distance = self._line_segment_distance(pos1, pos2, pos3, pos3)
                
                total_checks += 1
                if min_distance < self.safety_distance:
                    safety_violations += 1
        
        if total_checks == 0:
            return 1.0
        
        safety_score = 1.0 - (safety_violations / total_checks)
        return max(0.0, safety_score)
    
    def _line_segment_distance(self, p1: np.ndarray, p2: np.ndarray, p3: np.ndarray, p4: np.ndarray) -> float:
        """Calculate minimum distance between two line segments"""
        # Simplified distance calculation
        return min(
            np.linalg.norm(p1 - p3),
            np.linalg.norm(p1 - p4),
            np.linalg.norm(p2 - p3),
            np.linalg.norm(p2 - p4)
        )
    
    def _generate_visualization_data(self, path: List[Dict], start_position: List[float]) -> Dict[str, Any]:
        """Generate 3D visualization data for the path"""
        if not path:
            return {'points': [], 'connections': [], 'labels': []}
        
        # Generate path points
        points = [start_position]
        labels = ['Start']
        
        for i, step in enumerate(path):
            points.append(step['position'])
            labels.append(f"Debris {step['debris_id']}")
        
        # Generate connections
        connections = []
        for i in range(len(points) - 1):
            connections.append([i, i + 1])
        
        # Add metadata for visualization
        metadata = []
        for i, step in enumerate(path):
            debris_data = step['debris_data']
            metadata.append({
                'position': step['position'],
                'size': debris_data.get('estimated_size', 1.0),
                'material': debris_data.get('material', 'unknown'),
                'priority': debris_data.get('priority', 0.5),
                'feasible': debris_data.get('feasible', False),
                'debris_id': debris_data.get('id', i)
            })
        
        return {
            'points': points,
            'connections': connections,
            'labels': labels,
            'metadata': metadata,
            'start_position': start_position
        }
    
    def plan_alternative_paths(self, debris_list: List[Dict], start_position: List[float], num_alternatives: int = 3) -> List[Dict]:
        """Generate alternative path options"""
        if not debris_list:
            return []
        
        feasible_debris = [d for d in debris_list if d.get('feasible', False)]
        
        if not feasible_debris:
            return []
        
        alternative_paths = []
        
        # Generate different path strategies
        strategies = [
            ('priority_first', lambda x: sorted(x, key=lambda d: d.get('priority', 0), reverse=True)),
            ('distance_first', lambda x: sorted(x, key=lambda d: np.linalg.norm(np.array(d.get('center', [0,0,0])) - np.array(start_position)))),
            ('size_first', lambda x: sorted(x, key=lambda d: d.get('estimated_size', 0), reverse=True))
        ]
        
        for strategy_name, sort_func in strategies[:num_alternatives]:
            sorted_debris = sort_func(feasible_debris.copy())
            path = self._plan_greedy_path(sorted_debris, start_position)
            optimized_path = self._optimize_path(path, start_position)
            metrics = self._calculate_path_metrics(optimized_path, start_position)
            
            alternative_paths.append({
                'strategy': strategy_name,
                'path': optimized_path,
                'metrics': metrics,
                'visualization': self._generate_visualization_data(optimized_path, start_position)
            })
        
        return alternative_paths
