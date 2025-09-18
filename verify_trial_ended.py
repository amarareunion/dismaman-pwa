#!/usr/bin/env python3
"""
Verify the trial ended test user status
"""

import requests
import json
from datetime import datetime

BACKEND_URL = "https://dismaman-app-1.preview.emergentagent.com"
API_BASE = f"{BACKEND_URL}/api"

def login_and_check_status():
    """Login with test user and check status"""
    
    # Login
    login_data = {
        "email": "test-trial-ended@dismaman.fr",
        "password": "TestTrial123!"
    }
    
    response = requests.post(f"{API_BASE}/auth/token", json=login_data)
    
    if response.status_code == 200:
        data = response.json()
        access_token = data["access_token"]
        print(f"✅ Login successful for test-trial-ended@dismaman.fr")
        
        # Check monetization status
        headers = {"Authorization": f"Bearer {access_token}"}
        status_response = requests.get(f"{API_BASE}/monetization/status", headers=headers)
        
        if status_response.status_code == 200:
            status_data = status_response.json()
            print(f"\n📊 Monetization Status:")
            print(f"   - Is Premium: {status_data.get('is_premium', False)}")
            print(f"   - Trial Days Left: {status_data.get('trial_days_left', 0)}")
            print(f"   - Popup Frequency: {status_data.get('popup_frequency', '')}")
            print(f"   - Questions This Month: {status_data.get('questions_this_month', 0)}")
            print(f"   - Active Child ID: {status_data.get('active_child_id')}")
            print(f"   - Post-Trial Setup Required: {status_data.get('is_post_trial_setup_required', False)}")
            
            # Check children
            children_response = requests.get(f"{API_BASE}/children", headers=headers)
            if children_response.status_code == 200:
                children = children_response.json()
                print(f"\n📋 Available Children ({len(children)}):")
                for i, child in enumerate(children, 1):
                    print(f"   {i}. {child.get('name', 'Unknown')} ({child.get('gender', 'unknown')}, {child.get('age_months', 0)} months)")
                
                # Check if trial ended and child selection needed
                is_premium = status_data.get('is_premium', False)
                trial_days_left = status_data.get('trial_days_left', 0)
                popup_frequency = status_data.get('popup_frequency', '')
                
                print(f"\n🎯 CHILD SELECTION POPUP TEST STATUS:")
                if not is_premium and trial_days_left <= 0:
                    print(f"✅ User is in trial ended state!")
                    if len(children) >= 2:
                        print(f"✅ Multiple children available for selection!")
                        if popup_frequency == "child_selection" or status_data.get('is_post_trial_setup_required', False):
                            print(f"✅ Child selection popup should be triggered!")
                        else:
                            print(f"⚠️ Child selection popup may not be triggered (popup_frequency: {popup_frequency})")
                        print(f"\n🎉 READY FOR FRONTEND TESTING!")
                    else:
                        print(f"❌ Not enough children for selection ({len(children)})")
                else:
                    print(f"❌ User is not in trial ended state (Premium: {is_premium}, Trial: {trial_days_left}d)")
            else:
                print(f"❌ Failed to get children: {children_response.status_code}")
        else:
            print(f"❌ Failed to get status: {status_response.status_code}")
    else:
        print(f"❌ Login failed: {response.status_code} - {response.text}")

if __name__ == "__main__":
    login_and_check_status()