#!/usr/bin/env python3
"""
Launch script for HODOS AI Mega Demo
"""

import sys
import os
from pathlib import Path

# Add project root to Python path
project_root = Path(__file__).parent.parent.parent
sys.path.insert(0, str(project_root))

from backend.gradio_apps.mega_demo import create_app

def main():
    print("🚀 Launching HODOS AI Mega Demo...")
    print("=" * 50)
    print("This demo showcases ALL CrewAI capabilities:")
    print("- SEO & Marketing")
    print("- Content & Social Media")
    print("- Lead Generation & Client Management")
    print("- Legal Document Processing")
    print("- Business Intelligence")
    print("- Orchestrated Campaigns")
    print("=" * 50)
    
    app = create_app()
    
    print("\n✨ Starting Gradio interface...")
    print("📱 Access the demo at: http://localhost:7860")
    print("🌐 Public URL will be generated if share=True")
    print("\nPress Ctrl+C to stop the server.\n")
    
    app.launch(
        server_name="0.0.0.0",
        server_port=7860,
        share=True,  # Set to True to get a public URL
        favicon_path=None,
        show_error=True
    )

if __name__ == "__main__":
    main()