#!/usr/bin/env python3
"""
Rapid Backend Test for Dis Maman! - Focus on Authentication and Key Features
Test rapide de l'authentification et des fonctionnalités clés du backend "Dis Maman !"
"""

import requests
import json
import time
from datetime import datetime
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv('/app/frontend/.env')

# Get backend URL from frontend environment
BACKEND_URL = os.environ.get('EXPO_PUBLIC_BACKEND_URL', 'http://localhost:8001')
API_BASE = f"{BACKEND_URL}/api"

class RapidBackendTester:
    def __init__(self):
        self.access_token = None
        self.refresh_token = None
        self.user_id = None
        self.test_user_email = "test@dismaman.fr"
        self.test_user_password = "Test123!"
        self.children = []
        
    def log_test(self, test_name: str, status: str, details: str = ""):
        """Log test results"""
        timestamp = datetime.now().strftime("%H:%M:%S")
        status_symbol = "✅" if status == "PASS" else "❌" if status == "FAIL" else "⚠️"
        print(f"[{timestamp}] {status_symbol} {test_name}: {status}")
        if details:
            print(f"    {details}")
        print()

    def make_request(self, method: str, endpoint: str, data: dict = None, auth_required: bool = True) -> requests.Response:
        """Make HTTP request with proper headers"""
        url = f"{API_BASE}{endpoint}"
        
        headers = {"Content-Type": "application/json"}
        if auth_required and self.access_token:
            headers["Authorization"] = f"Bearer {self.access_token}"
        
        try:
            if method.upper() == "GET":
                response = requests.get(url, headers=headers, timeout=15)
            elif method.upper() == "POST":
                response = requests.post(url, json=data, headers=headers, timeout=15)
            else:
                raise ValueError(f"Unsupported HTTP method: {method}")
                
            return response
        except requests.exceptions.RequestException as e:
            print(f"❌ Request failed: {e}")
            raise

    def test_authentication_rapid(self) -> bool:
        """Test d'authentification rapide avec test@dismaman.fr / Test123!"""
        test_name = "Authentication Rapide"
        
        try:
            print("🔐 Test d'authentification avec test@dismaman.fr / Test123!")
            
            # Test login
            login_data = {
                "email": self.test_user_email,
                "password": self.test_user_password
            }
            
            response = self.make_request("POST", "/auth/token", login_data, auth_required=False)
            
            if response.status_code == 200:
                data = response.json()
                self.access_token = data["access_token"]
                self.refresh_token = data["refresh_token"]
                self.user_id = data["user"]["id"]
                
                # Verify JWT token format
                if self.access_token and len(self.access_token.split('.')) == 3:
                    self.log_test(test_name, "PASS", f"✅ Connexion réussie - JWT token généré correctement")
                    return True
                else:
                    self.log_test(test_name, "FAIL", "❌ Token JWT invalide")
                    return False
            else:
                self.log_test(test_name, "FAIL", f"❌ Échec connexion: {response.status_code} - {response.text}")
                return False
                
        except Exception as e:
            self.log_test(test_name, "FAIL", f"❌ Exception: {str(e)}")
            return False

    def test_monetization_api_rapid(self) -> bool:
        """Test de l'API de monétisation avec authentification"""
        test_name = "API Monétisation"
        
        try:
            print("💰 Test GET /api/monetization/status avec authentification")
            
            response = self.make_request("GET", "/monetization/status")
            
            if response.status_code == 200:
                data = response.json()
                required_fields = ["is_premium", "trial_days_left", "questions_asked", "popup_frequency"]
                
                # Vérifier tous les champs requis
                missing_fields = [field for field in required_fields if field not in data]
                if missing_fields:
                    self.log_test(test_name, "FAIL", f"❌ Champs manquants: {missing_fields}")
                    return False
                
                # Vérifier les types de données
                if not isinstance(data["is_premium"], bool):
                    self.log_test(test_name, "FAIL", f"❌ is_premium doit être boolean")
                    return False
                
                if not isinstance(data["trial_days_left"], int):
                    self.log_test(test_name, "FAIL", f"❌ trial_days_left doit être integer")
                    return False
                
                premium_status = "Premium" if data["is_premium"] else "Trial/Free"
                trial_days = data["trial_days_left"]
                questions = data["questions_asked"]
                popup = data["popup_frequency"]
                
                self.log_test(test_name, "PASS", 
                    f"✅ Statut: {premium_status}, Trial: {trial_days}j, Questions: {questions}, Popup: {popup}")
                return True
            else:
                self.log_test(test_name, "FAIL", f"❌ Status: {response.status_code} - {response.text}")
                return False
                
        except Exception as e:
            self.log_test(test_name, "FAIL", f"❌ Exception: {str(e)}")
            return False

    def test_children_api_rapid(self) -> bool:
        """Test des API enfants - vérifier accès à la liste"""
        test_name = "API Enfants"
        
        try:
            print("👶 Test GET /api/children pour vérifier accès liste enfants")
            
            response = self.make_request("GET", "/children")
            
            if response.status_code == 200:
                data = response.json()
                
                if not isinstance(data, list):
                    self.log_test(test_name, "FAIL", f"❌ Réponse doit être une liste, reçu: {type(data)}")
                    return False
                
                self.children = data
                children_count = len(data)
                
                # Vérifier structure des enfants si il y en a
                if children_count > 0:
                    child = data[0]
                    required_fields = ["id", "name", "gender", "age_months"]
                    missing_fields = [field for field in required_fields if field not in child]
                    
                    if missing_fields:
                        self.log_test(test_name, "FAIL", f"❌ Champs manquants dans enfant: {missing_fields}")
                        return False
                
                self.log_test(test_name, "PASS", f"✅ Liste enfants accessible - {children_count} enfant(s) trouvé(s)")
                return True
            else:
                self.log_test(test_name, "FAIL", f"❌ Status: {response.status_code} - {response.text}")
                return False
                
        except Exception as e:
            self.log_test(test_name, "FAIL", f"❌ Exception: {str(e)}")
            return False

    def test_ai_question_basic(self) -> bool:
        """Test de question basique pour vérifier que l'IA fonctionne"""
        test_name = "Question IA Basique"
        
        try:
            print("🤖 Test POST /api/questions avec question simple")
            
            if not self.children:
                self.log_test(test_name, "SKIP", "⚠️ Aucun enfant disponible pour test IA")
                return True
            
            # Utiliser le premier enfant disponible
            child_id = self.children[0]["id"]
            child_name = self.children[0]["name"]
            
            question_data = {
                "question": "Pourquoi le ciel est-il bleu?",
                "child_id": child_id
            }
            
            response = self.make_request("POST", "/questions", question_data)
            
            if response.status_code == 200:
                data = response.json()
                answer = data.get("answer", "")
                
                # Vérifier que ce n'est pas une réponse d'erreur
                if "je n'ai pas pu répondre" in answer.lower() or "redemander" in answer.lower():
                    self.log_test(test_name, "FAIL", f"❌ Réponse d'erreur IA: {answer[:100]}...")
                    return False
                
                # Vérifier que la réponse contient le nom de l'enfant (personnalisation)
                if child_name.lower() not in answer.lower():
                    self.log_test(test_name, "WARN", f"⚠️ Réponse non personnalisée (nom enfant absent)")
                
                # Vérifier que c'est une vraie réponse scientifique
                sky_keywords = ["bleu", "lumière", "soleil", "air", "particules"]
                if not any(keyword in answer.lower() for keyword in sky_keywords):
                    self.log_test(test_name, "WARN", f"⚠️ Réponse ne semble pas scientifique")
                
                response_length = len(answer)
                self.log_test(test_name, "PASS", 
                    f"✅ IA fonctionne - Réponse générée ({response_length} caractères) pour {child_name}")
                return True
            else:
                self.log_test(test_name, "FAIL", f"❌ Status: {response.status_code} - {response.text}")
                return False
                
        except Exception as e:
            self.log_test(test_name, "FAIL", f"❌ Exception: {str(e)}")
            return False

    def run_rapid_tests(self):
        """Exécuter tous les tests rapides"""
        print("=" * 80)
        print("🚀 TEST RAPIDE BACKEND 'DIS MAMAN !' - FOCUS AUTHENTIFICATION")
        print("=" * 80)
        print(f"🌐 Backend URL: {BACKEND_URL}")
        print(f"📧 Test User: {self.test_user_email}")
        print("=" * 80)
        print()
        
        tests = [
            ("1. Authentification", self.test_authentication_rapid),
            ("2. API Monétisation", self.test_monetization_api_rapid),
            ("3. API Enfants", self.test_children_api_rapid),
            ("4. Question IA", self.test_ai_question_basic),
        ]
        
        results = []
        
        for test_desc, test_func in tests:
            print(f"🔄 Exécution: {test_desc}")
            try:
                result = test_func()
                results.append((test_desc, result))
            except Exception as e:
                print(f"❌ Erreur critique dans {test_desc}: {e}")
                results.append((test_desc, False))
            print("-" * 50)
        
        # Résumé final
        print("\n" + "=" * 80)
        print("📊 RÉSUMÉ DES TESTS RAPIDES")
        print("=" * 80)
        
        passed = 0
        total = len(results)
        
        for test_desc, result in results:
            status = "✅ PASS" if result else "❌ FAIL"
            print(f"{status} {test_desc}")
            if result:
                passed += 1
        
        print("-" * 80)
        print(f"📈 Résultat: {passed}/{total} tests réussis ({(passed/total)*100:.1f}%)")
        
        if passed == total:
            print("🎉 TOUS LES TESTS BACKEND SONT PASSÉS!")
            print("✅ Le backend fonctionne correctement")
            print("🔍 Si problème frontend, c'est côté interface utilisateur")
        else:
            print("⚠️ PROBLÈMES DÉTECTÉS DANS LE BACKEND")
            print("🔧 Corrections nécessaires avant test frontend")
        
        print("=" * 80)
        
        return passed == total

if __name__ == "__main__":
    tester = RapidBackendTester()
    success = tester.run_rapid_tests()
    exit(0 if success else 1)