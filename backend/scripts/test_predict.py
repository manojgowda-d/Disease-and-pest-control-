import requests
import io
from PIL import Image

def test():
    img = Image.new('RGB', (224, 224), color=(34, 139, 34))
    buf = io.BytesIO()
    img.save(buf, format='JPEG')
    buf.seek(0)
    
    files = {'file': ('test_leaf.jpg', buf, 'image/jpeg')}
    res = requests.post('http://127.0.0.1:8000/api/predict', files=files)
    print("Status:", res.status_code)
    print("Response JSON:")
    import json
    print(json.dumps(res.json(), indent=2))

if __name__ == '__main__':
    test()
