#!/usr/bin/env python3
"""
Test User Credentials and Token Generator for Frontend Integration
Creates and displays credentials for test@dismaman.fr user
"""

import requests
import json
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv('/app/frontend/.env')

# Get backend URL from frontend environment
BACKEND_URL = os.environ.get('EXPO_PUBLIC_BACKEND_URL', 'http://localhost:8001')
API_BASE = f"{BACKEND_URL}/api"

def get_test_user_tokens():
    """Get tokens for the test user"""
    
    # Test user credentials as requested
    test_credentials = {
        "email": "test@dismaman.fr",
        "password": "Test123!"
    }
    
    print("=" * 80)
    print("TEST USER CREDENTIALS FOR FRONTEND INTEGRATION")
    print("=" * 80)
    print()
    
    print("📧 USER CREDENTIALS:")
    print(f"   Email: {test_credentials['email']}")
    print(f"   Password: {test_credentials['password']}")
    print(f"   Nom: Test")
    print(f"   Prénom: User")
    print()
    
    try:
        # Try to login with the test user
        response = requests.post(
            f"{API_BASE}/auth/token",
            json=test_credentials,
            headers={"Content-Type": "application/json"},
            timeout=30
        )
        
        if response.status_code == 200:
            data = response.json()
            
            print("🔑 JWT TOKENS:")
            print(f"   Access Token: {data['access_token']}")
            print(f"   Refresh Token: {data['refresh_token']}")
            print(f"   Token Type: {data['token_type']}")
            print()
            
            print("👤 USER INFO:")
            print(f"   User ID: {data['user']['id']}")
            print(f"   Email: {data['user']['email']}")
            print(f"   First Name: {data['user']['first_name']}")
            print(f"   Last Name: {data['user']['last_name']}")
            print()
            
            # Test the tokens by calling protected endpoints
            headers = {
                "Authorization": f"Bearer {data['access_token']}",
                "Content-Type": "application/json"
            }
            
            print("🧪 TESTING PROTECTED ENDPOINTS:")
            
            # Test GET /api/children
            children_response = requests.get(f"{API_BASE}/children", headers=headers, timeout=30)
            if children_response.status_code == 200:
                children_data = children_response.json()
                print(f"   ✅ GET /api/children: {len(children_data)} children found")
            else:
                print(f"   ❌ GET /api/children: Error {children_response.status_code}")
            
            # Test GET /api/monetization/status
            monetization_response = requests.get(f"{API_BASE}/monetization/status", headers=headers, timeout=30)
            if monetization_response.status_code == 200:
                monetization_data = monetization_response.json()
                print(f"   ✅ GET /api/monetization/status: Premium={monetization_data['is_premium']}, Trial={monetization_data['trial_days_left']}d")
            else:
                print(f"   ❌ GET /api/monetization/status: Error {monetization_response.status_code}")
            
            print()
            print("🎯 READY FOR FRONTEND INTEGRATION!")
            print("   The test user is created and tokens are valid.")
            print("   Frontend can use these credentials to authenticate and access protected APIs.")
            
        else:
            print(f"❌ LOGIN FAILED: {response.status_code}")
            print(f"   Response: {response.text}")
            
            # Try to register the user if login failed
            print("\n🔄 ATTEMPTING TO CREATE TEST USER...")
            
            user_data = {
                "email": test_credentials["email"],
                "password": test_credentials["password"],
                "first_name": "Test",
                "last_name": "User"
            }
            
            register_response = requests.post(
                f"{API_BASE}/auth/register",
                json=user_data,
                headers={"Content-Type": "application/json"},
                timeout=30
            )
            
            if register_response.status_code in [200, 201]:
                reg_data = register_response.json()
                print("✅ USER CREATED SUCCESSFULLY!")
                print()
                print("🔑 JWT TOKENS:")
                print(f"   Access Token: {reg_data['access_token']}")
                print(f"   Refresh Token: {reg_data['refresh_token']}")
                print(f"   Token Type: {reg_data['token_type']}")
                print()
                print("👤 USER INFO:")
                print(f"   User ID: {reg_data['user']['id']}")
                print(f"   Email: {reg_data['user']['email']}")
                print(f"   First Name: {reg_data['user']['first_name']}")
                print(f"   Last Name: {reg_data['user']['last_name']}")
            else:
                print(f"❌ REGISTRATION FAILED: {register_response.status_code}")
                print(f"   Response: {register_response.text}")
    
    except Exception as e:
        print(f"❌ ERROR: {str(e)}")
    
    print()
    print("=" * 80)

if __name__ == "__main__":
    get_test_user_tokens()