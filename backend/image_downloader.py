import requests
import os
import time
from urllib.parse import urlparse, urljoin
from bs4 import BeautifulSoup
import json
from typing import List, Dict, Optional
import logging

logger = logging.getLogger(__name__)

class SpaceDebrisImageDownloader:
    def __init__(self, download_dir: str = "sample_images"):
        self.download_dir = download_dir
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        })
        
        # Create download directory
        os.makedirs(download_dir, exist_ok=True)
        
        # NASA APIs and image sources
        self.nasa_apod_url = "https://api.nasa.gov/planetary/apod"
        self.nasa_apod_key = "DEMO_KEY"  # Free API key
        
        # Space debris image sources
        self.image_sources = {
            'nasa_apod': {
                'url': 'https://api.nasa.gov/planetary/apod',
                'description': 'NASA Astronomy Picture of the Day'
            },
            'nasa_images': {
                'url': 'https://images-api.nasa.gov/search',
                'description': 'NASA Image and Video Library'
            },
            'esa_images': {
                'url': 'https://www.esa.int/ESA_Multimedia/Search',
                'description': 'European Space Agency Images'
            },
            'space_debris_keywords': [
                'space debris', 'orbital debris', 'satellite debris',
                'space junk', 'orbital junk', 'spacecraft debris',
                'rocket debris', 'space waste', 'orbital waste'
            ]
        }
    
    def download_nasa_apod(self, count: int = 5) -> List[Dict]:
        """Download NASA Astronomy Picture of the Day images"""
        downloaded_images = []
        
        try:
            for i in range(count):
                # Get APOD for different dates
                params = {
                    'api_key': self.nasa_apod_key,
                    'count': 1,
                    'thumbs': False
                }
                
                response = self.session.get(self.nasa_apod_url, params=params)
                response.raise_for_status()
                
                data = response.json()
                if isinstance(data, list):
                    data = data[0]
                
                if data.get('media_type') == 'image':
                    image_url = data['url']
                    title = data.get('title', 'NASA APOD')
                    explanation = data.get('explanation', '')
                    
                    # Download image
                    image_path = self._download_image(image_url, f"nasa_apod_{i+1}")
                    
                    if image_path:
                        downloaded_images.append({
                            'path': image_path,
                            'title': title,
                            'description': explanation,
                            'source': 'NASA APOD',
                            'url': image_url
                        })
                
                time.sleep(1)  # Rate limiting
                
        except Exception as e:
            logger.error(f"Error downloading NASA APOD: {str(e)}")
        
        return downloaded_images
    
    def download_nasa_images(self, query: str = "space debris", count: int = 10) -> List[Dict]:
        """Download images from NASA Image and Video Library"""
        downloaded_images = []
        
        try:
            search_url = "https://images-api.nasa.gov/search"
            params = {
                'q': query,
                'media_type': 'image',
                'page_size': min(count, 100)
            }
            
            response = self.session.get(search_url, params=params)
            response.raise_for_status()
            
            data = response.json()
            items = data.get('collection', {}).get('items', [])
            
            for i, item in enumerate(items[:count]):
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
                    title = data_item.get('title', f'NASA Image {i+1}')
                    description = data_item.get('description', '')
                    
                    # Download image
                    image_path = self._download_image(image_url, f"nasa_{i+1}")
                    
                    if image_path:
                        downloaded_images.append({
                            'path': image_path,
                            'title': title,
                            'description': description,
                            'source': 'NASA Images',
                            'url': image_url
                        })
                    
                    time.sleep(0.5)  # Rate limiting
                    
                except Exception as e:
                    logger.error(f"Error downloading NASA image {i+1}: {str(e)}")
                    continue
                    
        except Exception as e:
            logger.error(f"Error accessing NASA Images API: {str(e)}")
        
        return downloaded_images
    
    def download_space_debris_images(self, count: int = 15) -> List[Dict]:
        """Download space debris images from various sources"""
        downloaded_images = []
        
        # Try different search terms
        search_terms = [
            "space debris",
            "orbital debris", 
            "space junk",
            "satellite debris",
            "spacecraft debris"
        ]
        
        for term in search_terms:
            if len(downloaded_images) >= count:
                break
                
            try:
                # Search NASA images
                nasa_images = self.download_nasa_images(term, count // len(search_terms))
                downloaded_images.extend(nasa_images)
                
                time.sleep(2)  # Rate limiting between searches
                
            except Exception as e:
                logger.error(f"Error downloading images for term '{term}': {str(e)}")
                continue
        
        return downloaded_images[:count]
    
    def download_from_url(self, url: str, filename: Optional[str] = None) -> Optional[str]:
        """Download a single image from URL"""
        try:
            response = self.session.get(url, stream=True)
            response.raise_for_status()
            
            # Determine filename
            if not filename:
                parsed_url = urlparse(url)
                filename = os.path.basename(parsed_url.path)
                if not filename or '.' not in filename:
                    filename = f"downloaded_image_{int(time.time())}.jpg"
            
            # Ensure filename has extension
            if '.' not in filename:
                filename += '.jpg'
            
            filepath = os.path.join(self.download_dir, filename)
            
            # Download image
            with open(filepath, 'wb') as f:
                for chunk in response.iter_content(chunk_size=8192):
                    f.write(chunk)
            
            logger.info(f"Downloaded image: {filepath}")
            return filepath
            
        except Exception as e:
            logger.error(f"Error downloading image from {url}: {str(e)}")
            return None
    
    def _download_image(self, url: str, filename: str) -> Optional[str]:
        """Internal method to download image with error handling"""
        try:
            response = self.session.get(url, stream=True, timeout=30)
            response.raise_for_status()
            
            # Check if it's actually an image
            content_type = response.headers.get('content-type', '')
            if not content_type.startswith('image/'):
                logger.warning(f"URL {url} does not appear to be an image (content-type: {content_type})")
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
            
            filepath = os.path.join(self.download_dir, f"{filename}{ext}")
            
            # Download image
            with open(filepath, 'wb') as f:
                for chunk in response.iter_content(chunk_size=8192):
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
    
    def create_sample_dataset(self, total_images: int = 20) -> List[Dict]:
        """Create a sample dataset of space-related images"""
        all_images = []
        
        logger.info(f"Creating sample dataset with {total_images} images...")
        
        # Download NASA APOD images
        logger.info("Downloading NASA APOD images...")
        apod_images = self.download_nasa_apod(min(5, total_images // 4))
        all_images.extend(apod_images)
        
        # Download space debris images
        logger.info("Downloading space debris images...")
        debris_images = self.download_space_debris_images(total_images - len(all_images))
        all_images.extend(debris_images)
        
        # Save metadata
        metadata_file = os.path.join(self.download_dir, "dataset_metadata.json")
        with open(metadata_file, 'w') as f:
            json.dump(all_images, f, indent=2)
        
        logger.info(f"Sample dataset created with {len(all_images)} images")
        logger.info(f"Images saved to: {self.download_dir}")
        logger.info(f"Metadata saved to: {metadata_file}")
        
        return all_images
    
    def get_downloaded_images(self) -> List[str]:
        """Get list of all downloaded image files"""
        image_files = []
        
        if os.path.exists(self.download_dir):
            for filename in os.listdir(self.download_dir):
                if filename.lower().endswith(('.jpg', '.jpeg', '.png', '.gif', '.bmp', '.tiff')):
                    image_files.append(os.path.join(self.download_dir, filename))
        
        return image_files
    
    def cleanup(self):
        """Clean up downloaded images"""
        if os.path.exists(self.download_dir):
            import shutil
            shutil.rmtree(self.download_dir)
            logger.info(f"Cleaned up download directory: {self.download_dir}")

def main():
    """Main function for testing the downloader"""
    downloader = SpaceDebrisImageDownloader()
    
    try:
        # Create sample dataset
        images = downloader.create_sample_dataset(10)
        
        print(f"\nDownloaded {len(images)} images:")
        for img in images:
            print(f"- {img['title']}: {img['path']}")
        
        # List all downloaded images
        all_images = downloader.get_downloaded_images()
        print(f"\nTotal images in directory: {len(all_images)}")
        
    except KeyboardInterrupt:
        print("\nDownload interrupted by user")
    except Exception as e:
        print(f"Error: {e}")
    finally:
        print("\nDownload process completed")

if __name__ == "__main__":
    main()
