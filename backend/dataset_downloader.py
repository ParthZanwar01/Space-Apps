import os
import requests
import json
import zipfile
import shutil
from typing import List, Dict, Optional, Any
import logging
from urllib.parse import urljoin, urlparse
from pathlib import Path
import time
from tqdm import tqdm

logger = logging.getLogger(__name__)

class DatasetDownloader:
    def __init__(self, download_dir: str = "datasets"):
        self.download_dir = download_dir
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        })
        
        # Create download directory
        os.makedirs(download_dir, exist_ok=True)
        
        # Space debris and satellite dataset sources
        self.dataset_sources = {
            'kaggle': {
                'space_debris': [
                    'https://www.kaggle.com/datasets/agriinnovate/space-debris-detection',
                    'https://www.kaggle.com/datasets/space-debris/satellite-imagery',
                    'https://www.kaggle.com/datasets/nasa/space-debris-tracking',
                    'https://www.kaggle.com/datasets/esa/satellite-debris-dataset'
                ],
                'satellite_imagery': [
                    'https://www.kaggle.com/datasets/nasa/satellite-imagery',
                    'https://www.kaggle.com/datasets/esa/satellite-images',
                    'https://www.kaggle.com/datasets/spacex/satellite-data',
                    'https://www.kaggle.com/datasets/planet/satellite-imagery'
                ]
            },
            'nasa_apis': {
                'apod': 'https://api.nasa.gov/planetary/apod',
                'images': 'https://images-api.nasa.gov/search',
                'earth': 'https://api.nasa.gov/planetary/earth/imagery'
            },
            'esa_datasets': {
                'space_debris': 'https://www.esa.int/ESA_Multimedia/Search',
                'satellite_images': 'https://earth.esa.int/'
            },
            'open_datasets': {
                'space_debris_tracking': 'https://www.space-track.org/',
                'satellite_catalog': 'https://celestrak.com/',
                'orbital_data': 'https://www.space-track.org/api'
            }
        }
    
    def download_kaggle_dataset(self, dataset_url: str, extract: bool = True) -> Optional[str]:
        """Download dataset from Kaggle (requires Kaggle API)"""
        try:
            # Note: This would require Kaggle API setup
            # For now, we'll simulate the process
            logger.info(f"Kaggle dataset download from: {dataset_url}")
            
            # Extract dataset name from URL
            dataset_name = dataset_url.split('/')[-1]
            dataset_path = os.path.join(self.download_dir, f"kaggle_{dataset_name}")
            
            # Create placeholder for Kaggle dataset
            os.makedirs(dataset_path, exist_ok=True)
            
            # Create a metadata file
            metadata = {
                'source': 'kaggle',
                'url': dataset_url,
                'name': dataset_name,
                'downloaded_at': time.time(),
                'status': 'placeholder',
                'note': 'Kaggle API required for actual download'
            }
            
            with open(os.path.join(dataset_path, 'metadata.json'), 'w') as f:
                json.dump(metadata, f, indent=2)
            
            logger.info(f"Created placeholder for Kaggle dataset: {dataset_path}")
            return dataset_path
            
        except Exception as e:
            logger.error(f"Error downloading Kaggle dataset: {str(e)}")
            return None
    
    def download_nasa_dataset(self, dataset_type: str = 'apod', count: int = 50) -> List[Dict]:
        """Download larger dataset from NASA APIs"""
        downloaded_images = []
        
        try:
            if dataset_type == 'apod':
                downloaded_images = self._download_nasa_apod_large(count)
            elif dataset_type == 'images':
                downloaded_images = self._download_nasa_images_large(count)
            elif dataset_type == 'earth':
                downloaded_images = self._download_nasa_earth_images(count)
            
            # Save dataset metadata
            self._save_dataset_metadata('nasa', dataset_type, downloaded_images)
            
            return downloaded_images
            
        except Exception as e:
            logger.error(f"Error downloading NASA dataset: {str(e)}")
            return []
    
    def _download_nasa_apod_large(self, count: int) -> List[Dict]:
        """Download large number of NASA APOD images"""
        downloaded_images = []
        
        for i in tqdm(range(count), desc="Downloading NASA APOD images"):
            try:
                # Get APOD for different dates
                params = {
                    'api_key': 'DEMO_KEY',
                    'count': 1,
                    'thumbs': False
                }
                
                response = self.session.get(
                    'https://api.nasa.gov/planetary/apod',
                    params=params,
                    timeout=30
                )
                response.raise_for_status()
                
                data = response.json()
                if isinstance(data, list):
                    data = data[0]
                
                if data.get('media_type') == 'image':
                    image_url = data['url']
                    title = data.get('title', f'NASA APOD {i+1}')
                    explanation = data.get('explanation', '')
                    
                    # Download image
                    image_path = self._download_image(
                        image_url,
                        f"nasa_apod_large_{i+1}",
                        os.path.join(self.download_dir, 'nasa_apod_large')
                    )
                    
                    if image_path:
                        downloaded_images.append({
                            'path': image_path,
                            'title': title,
                            'description': explanation,
                            'source': 'NASA APOD',
                            'url': image_url,
                            'index': i + 1
                        })
                
                time.sleep(1)  # Rate limiting
                
            except Exception as e:
                logger.error(f"Error downloading APOD {i+1}: {str(e)}")
                continue
        
        return downloaded_images
    
    def _download_nasa_images_large(self, count: int) -> List[Dict]:
        """Download large number of images from NASA Image Library"""
        downloaded_images = []
        
        search_terms = [
            'space debris', 'orbital debris', 'satellite debris',
            'spacecraft', 'satellite', 'space station',
            'rocket', 'space mission', 'astronaut',
            'space exploration', 'mars', 'moon', 'earth'
        ]
        
        images_per_term = count // len(search_terms)
        
        for term in search_terms:
            if len(downloaded_images) >= count:
                break
                
            try:
                search_url = "https://images-api.nasa.gov/search"
                params = {
                    'q': term,
                    'media_type': 'image',
                    'page_size': min(images_per_term, 100)
                }
                
                response = self.session.get(search_url, params=params, timeout=30)
                response.raise_for_status()
                
                data = response.json()
                items = data.get('collection', {}).get('items', [])
                
                for i, item in enumerate(items):
                    if len(downloaded_images) >= count:
                        break
                        
                    try:
                        # Get image URL
                        links = item.get('links', [])
                        image_url = None
                        
                        for link in links:
                            if link.get('render') == 'image':
                                image_url = link.get('href')
                                break
                        
                        if not image_url:
                            continue
                        
                        # Get metadata
                        data_item = item.get('data', [{}])[0]
                        title = data_item.get('title', f'NASA Image {len(downloaded_images)+1}')
                        description = data_item.get('description', '')
                        
                        # Download image
                        image_path = self._download_image(
                            image_url,
                            f"nasa_images_{len(downloaded_images)+1}",
                            os.path.join(self.download_dir, 'nasa_images_large')
                        )
                        
                        if image_path:
                            downloaded_images.append({
                                'path': image_path,
                                'title': title,
                                'description': description,
                                'source': 'NASA Images',
                                'url': image_url,
                                'search_term': term,
                                'index': len(downloaded_images) + 1
                            })
                        
                        time.sleep(0.5)  # Rate limiting
                        
                    except Exception as e:
                        logger.error(f"Error downloading NASA image: {str(e)}")
                        continue
                
                time.sleep(2)  # Rate limiting between searches
                
            except Exception as e:
                logger.error(f"Error searching NASA images for '{term}': {str(e)}")
                continue
        
        return downloaded_images[:count]
    
    def _download_nasa_earth_images(self, count: int) -> List[Dict]:
        """Download NASA Earth imagery"""
        downloaded_images = []
        
        # Sample coordinates for interesting locations
        coordinates = [
            {'lat': 40.7128, 'lon': -74.0060, 'name': 'New York'},  # NYC
            {'lat': 51.5074, 'lon': -0.1278, 'name': 'London'},     # London
            {'lat': 35.6762, 'lon': 139.6503, 'name': 'Tokyo'},     # Tokyo
            {'lat': -33.8688, 'lon': 151.2093, 'name': 'Sydney'},   # Sydney
            {'lat': 48.8566, 'lon': 2.3522, 'name': 'Paris'},       # Paris
            {'lat': 55.7558, 'lon': 37.6176, 'name': 'Moscow'},     # Moscow
            {'lat': 39.9042, 'lon': 116.4074, 'name': 'Beijing'},   # Beijing
            {'lat': -22.9068, 'lon': -43.1729, 'name': 'Rio'},      # Rio
            {'lat': 19.4326, 'lon': -99.1332, 'name': 'Mexico City'}, # Mexico City
            {'lat': 28.6139, 'lon': 77.2090, 'name': 'Delhi'}       # Delhi
        ]
        
        images_per_location = count // len(coordinates)
        
        for coord in coordinates:
            if len(downloaded_images) >= count:
                break
                
            for i in range(images_per_location):
                if len(downloaded_images) >= count:
                    break
                    
                try:
                    # NASA Earth API (note: requires API key for production)
                    params = {
                        'lat': coord['lat'],
                        'lon': coord['lon'],
                        'date': '2020-01-01',  # Sample date
                        'dim': 0.1,
                        'api_key': 'DEMO_KEY'
                    }
                    
                    response = self.session.get(
                        'https://api.nasa.gov/planetary/earth/imagery',
                        params=params,
                        timeout=30
                    )
                    
                    if response.status_code == 200:
                        data = response.json()
                        image_url = data.get('url')
                        
                        if image_url:
                            image_path = self._download_image(
                                image_url,
                                f"nasa_earth_{coord['name']}_{i+1}",
                                os.path.join(self.download_dir, 'nasa_earth')
                            )
                            
                            if image_path:
                                downloaded_images.append({
                                    'path': image_path,
                                    'title': f"Earth View - {coord['name']}",
                                    'description': f"Satellite view of {coord['name']}",
                                    'source': 'NASA Earth',
                                    'url': image_url,
                                    'coordinates': coord,
                                    'index': len(downloaded_images) + 1
                                })
                    
                    time.sleep(1)  # Rate limiting
                    
                except Exception as e:
                    logger.error(f"Error downloading Earth image: {str(e)}")
                    continue
        
        return downloaded_images
    
    def _download_image(self, url: str, filename: str, target_dir: str) -> Optional[str]:
        """Download a single image from URL"""
        try:
            os.makedirs(target_dir, exist_ok=True)
            
            response = self.session.get(url, stream=True, timeout=30)
            response.raise_for_status()
            
            # Check if it's actually an image
            content_type = response.headers.get('content-type', '')
            if not content_type.startswith('image/'):
                logger.warning(f"URL {url} does not appear to be an image")
                return None
            
            # Determine file extension
            if 'jpeg' in content_type or 'jpg' in content_type:
                ext = '.jpg'
            elif 'png' in content_type:
                ext = '.png'
            elif 'gif' in content_type:
                ext = '.gif'
            elif 'webp' in content_type:
                ext = '.webp'
            else:
                ext = '.jpg'  # Default
            
            filepath = os.path.join(target_dir, f"{filename}{ext}")
            
            # Download image with progress bar
            total_size = int(response.headers.get('content-length', 0))
            with open(filepath, 'wb') as f:
                if total_size > 0:
                    with tqdm(total=total_size, unit='B', unit_scale=True, desc=filename) as pbar:
                        for chunk in response.iter_content(chunk_size=8192):
                            if chunk:
                                f.write(chunk)
                                pbar.update(len(chunk))
                else:
                    for chunk in response.iter_content(chunk_size=8192):
                        if chunk:
                            f.write(chunk)
            
            # Verify file was downloaded and has content
            if os.path.getsize(filepath) > 0:
                logger.info(f"Successfully downloaded: {filepath}")
                return filepath
            else:
                os.remove(filepath)
                logger.warning(f"Downloaded file is empty: {url}")
                return None
                
        except Exception as e:
            logger.error(f"Error downloading image from {url}: {str(e)}")
            return None
    
    def _save_dataset_metadata(self, source: str, dataset_type: str, images: List[Dict]):
        """Save metadata for downloaded dataset"""
        try:
            metadata = {
                'source': source,
                'dataset_type': dataset_type,
                'download_date': time.time(),
                'total_images': len(images),
                'images': images,
                'statistics': {
                    'total_size': sum(os.path.getsize(img['path']) for img in images if os.path.exists(img['path'])),
                    'sources': list(set(img['source'] for img in images)),
                    'file_types': list(set(os.path.splitext(img['path'])[1] for img in images))
                }
            }
            
            metadata_file = os.path.join(self.download_dir, f"{source}_{dataset_type}_metadata.json")
            with open(metadata_file, 'w') as f:
                json.dump(metadata, f, indent=2)
            
            logger.info(f"Saved dataset metadata: {metadata_file}")
            
        except Exception as e:
            logger.error(f"Error saving dataset metadata: {str(e)}")
    
    def create_comprehensive_dataset(self, total_images: int = 200) -> Dict[str, Any]:
        """Create a comprehensive space debris dataset from multiple sources"""
        logger.info(f"Creating comprehensive dataset with {total_images} images...")
        
        all_images = []
        
        # Download from NASA APOD (30% of dataset)
        apod_count = int(total_images * 0.3)
        logger.info(f"Downloading {apod_count} NASA APOD images...")
        apod_images = self.download_nasa_dataset('apod', apod_count)
        all_images.extend(apod_images)
        
        # Download from NASA Images (40% of dataset)
        nasa_count = int(total_images * 0.4)
        logger.info(f"Downloading {nasa_count} NASA Images...")
        nasa_images = self.download_nasa_dataset('images', nasa_count)
        all_images.extend(nasa_images)
        
        # Download from NASA Earth (20% of dataset)
        earth_count = int(total_images * 0.2)
        logger.info(f"Downloading {earth_count} NASA Earth images...")
        earth_images = self.download_nasa_dataset('earth', earth_count)
        all_images.extend(earth_images)
        
        # Download from ESA and other sources (10% of dataset)
        remaining_count = total_images - len(all_images)
        if remaining_count > 0:
            logger.info(f"Downloading {remaining_count} additional images...")
            # Add more sources here as needed
        
        # Save comprehensive metadata
        self._save_dataset_metadata('comprehensive', 'mixed', all_images)
        
        logger.info(f"Comprehensive dataset created with {len(all_images)} images")
        return {
            'total_images': len(all_images),
            'images': all_images,
            'download_directory': self.download_dir,
            'sources': list(set(img['source'] for img in all_images))
        }
    
    def get_dataset_info(self) -> Dict[str, Any]:
        """Get information about downloaded datasets"""
        try:
            datasets = {}
            
            for root, dirs, files in os.walk(self.download_dir):
                for file in files:
                    if file.endswith('_metadata.json'):
                        metadata_file = os.path.join(root, file)
                        try:
                            with open(metadata_file, 'r') as f:
                                metadata = json.load(f)
                                datasets[file] = metadata
                        except Exception as e:
                            logger.error(f"Error reading metadata file {metadata_file}: {str(e)}")
            
            return {
                'datasets': datasets,
                'total_datasets': len(datasets),
                'download_directory': self.download_dir
            }
            
        except Exception as e:
            logger.error(f"Error getting dataset info: {str(e)}")
            return {'error': str(e)}
    
    def cleanup_old_datasets(self, days_old: int = 30):
        """Clean up datasets older than specified days"""
        try:
            current_time = time.time()
            cutoff_time = current_time - (days_old * 24 * 60 * 60)
            
            removed_count = 0
            for root, dirs, files in os.walk(self.download_dir):
                for file in files:
                    file_path = os.path.join(root, file)
                    if os.path.getmtime(file_path) < cutoff_time:
                        try:
                            os.remove(file_path)
                            removed_count += 1
                            logger.info(f"Removed old file: {file_path}")
                        except Exception as e:
                            logger.error(f"Error removing file {file_path}: {str(e)}")
            
            logger.info(f"Cleaned up {removed_count} old files")
            return removed_count
            
        except Exception as e:
            logger.error(f"Error during cleanup: {str(e)}")
            return 0

def main():
    """Main function for testing the dataset downloader"""
    downloader = DatasetDownloader()
    
    try:
        # Create a comprehensive dataset
        result = downloader.create_comprehensive_dataset(100)
        
        print(f"\nDataset creation completed!")
        print(f"Total images: {result['total_images']}")
        print(f"Download directory: {result['download_directory']}")
        print(f"Sources: {', '.join(result['sources'])}")
        
        # Get dataset info
        info = downloader.get_dataset_info()
        print(f"\nDataset info:")
        print(f"Total datasets: {info['total_datasets']}")
        
    except KeyboardInterrupt:
        print("\nDownload interrupted by user")
    except Exception as e:
        print(f"Error: {e}")
    finally:
        print("\nDataset download process completed")

if __name__ == "__main__":
    main()
