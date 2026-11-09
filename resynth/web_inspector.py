import urllib.request
import re
import json
from typing import Dict, Any, List

class WebInspector:
    """
    Reverse-engineers websites and web applications:
    Extracts design tokens, DOM hierarchy, asset links, and API contracts.
    """

    @staticmethod
    def inspect_url(url: str) -> Dict[str, Any]:
        result: Dict[str, Any] = {
            "url": url,
            "title": "",
            "design_tokens": {
                "colors": [],
                "fonts": [],
            },
            "assets": {
                "images": [],
                "stylesheets": [],
                "scripts": []
            },
            "api_endpoints": []
        }

        try:
            req = urllib.request.Request(
                url,
                headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"}
            )
            with urllib.request.urlopen(req, timeout=10) as response:
                html = response.read().decode('utf-8', errors='ignore')

                # Extract title
                title_match = re.search(r'<title>(.*?)</title>', html, re.IGNORECASE)
                if title_match:
                    result["title"] = title_match.group(1).strip()

                # Extract hex colors
                hex_colors = set(re.findall(r'#(?:[0-9a-fA-F]{3}){1,2}\b', html))
                result["design_tokens"]["colors"] = list(hex_colors)[:15]

                # Extract script assets
                scripts = re.findall(r'<script[^>]+src=["\']([^"\']+)["\']', html, re.IGNORECASE)
                result["assets"]["scripts"] = scripts[:10]

                # Extract stylesheets
                css = re.findall(r'<link[^>]+href=["\']([^"\']+\.css[^"\']*)["\']', html, re.IGNORECASE)
                result["assets"]["stylesheets"] = css[:10]

                # Extract images
                imgs = re.findall(r'<img[^>]+src=["\']([^"\']+)["\']', html, re.IGNORECASE)
                result["assets"]["images"] = imgs[:10]

                # Extract probable API endpoints from inline JS
                apis = set(re.findall(r'["\'](/api/[a-zA-Z0-9_\-\/]+)["\']', html))
                result["api_endpoints"] = list(apis)

        except Exception as e:
            result["error"] = str(e)

        return result

