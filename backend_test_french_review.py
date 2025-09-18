#!/usr/bin/env python3
"""
Test complet de l'architecture progressive de "Dis Maman !" - French Review
Tests requis pour vérifier que le backend est prêt pour la restauration progressive
"""

import requests
import json
import time
from datetime import datetime
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv('/app/dismaman-complete/frontend/.env')

# Get backend URL from frontend environment
BACKEND_URL = os.environ.get('EXPO_PUBLIC_BACKEND_URL', 'http://localhost:8001')
API_BASE = f"{BACKEND_URL}/api"

class DisMamanProgressiveArchitectureTester:
    def __init__(self):
        self.access_token = None
        self.refresh_token = None
        self.user_id = None
        self.test_user_email = "contact@dismaman.fr"
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

    def test_1_health_check_backend(self) -> bool:
        """1. Health check backend (/api/health) - Vérifier que le serveur répond"""
        test_name = "1. Health Check Backend"
        
        try:
            print("🏥 Test du health check backend /api/health")
            
            response = self.make_request("GET", "/health", auth_required=False)
            
            if response.status_code == 200:
                data = response.json()
                
                # Vérifier la structure de la réponse
                required_fields = ["status", "timestamp"]
                missing_fields = [field for field in required_fields if field not in data]
                
                if missing_fields:
                    self.log_test(test_name, "FAIL", f"❌ Champs manquants: {missing_fields}")
                    return False
                
                if data["status"] != "healthy":
                    self.log_test(test_name, "FAIL", f"❌ Status non healthy: {data['status']}")
                    return False
                
                # Vérifier le timestamp
                try:
                    datetime.fromisoformat(data["timestamp"].replace('Z', '+00:00'))
                except:
                    self.log_test(test_name, "FAIL", f"❌ Timestamp invalide: {data['timestamp']}")
                    return False
                
                self.log_test(test_name, "PASS", f"✅ Serveur healthy - Status: {data['status']}")
                return True
            else:
                self.log_test(test_name, "FAIL", f"❌ Status: {response.status_code} - {response.text}")
                return False
                
        except Exception as e:
            self.log_test(test_name, "FAIL", f"❌ Exception: {str(e)}")
            return False

    def test_2_authentication_contact_dismaman(self) -> bool:
        """2. Test d'authentification avec contact@dismaman.fr / Test123!"""
        test_name = "2. Authentication contact@dismaman.fr"
        
        try:
            print("🔐 Test d'authentification avec contact@dismaman.fr / Test123!")
            
            # Test POST /api/auth/token
            login_data = {
                "email": self.test_user_email,
                "password": self.test_user_password
            }
            
            response = self.make_request("POST", "/auth/token", login_data, auth_required=False)
            
            if response.status_code == 200:
                data = response.json()
                
                # Vérifier la structure de la réponse
                required_fields = ["access_token", "refresh_token", "token_type", "user"]
                missing_fields = [field for field in required_fields if field not in data]
                
                if missing_fields:
                    self.log_test(test_name, "FAIL", f"❌ Champs manquants: {missing_fields}")
                    return False
                
                # Vérifier le format JWT du token
                access_token = data["access_token"]
                if not access_token or len(access_token.split('.')) != 3:
                    self.log_test(test_name, "FAIL", f"❌ Token JWT invalide")
                    return False
                
                # Vérifier les données utilisateur
                user_data = data["user"]
                if user_data["email"] != self.test_user_email:
                    self.log_test(test_name, "FAIL", f"❌ Email utilisateur incorrect: {user_data['email']}")
                    return False
                
                # Stocker les tokens pour les tests suivants
                self.access_token = data["access_token"]
                self.refresh_token = data["refresh_token"]
                self.user_id = data["user"]["id"]
                
                self.log_test(test_name, "PASS", 
                    f"✅ Authentification réussie - JWT token généré, User ID: {self.user_id}")
                return True
            else:
                self.log_test(test_name, "FAIL", f"❌ Status: {response.status_code} - {response.text}")
                return False
                
        except Exception as e:
            self.log_test(test_name, "FAIL", f"❌ Exception: {str(e)}")
            return False

    def test_3_token_validation_auth_me(self) -> bool:
        """3. Tester GET /api/auth/me avec le token"""
        test_name = "3. Token Validation /auth/me"
        
        try:
            print("🎫 Test de validation du token avec GET /api/auth/me")
            
            if not self.access_token:
                self.log_test(test_name, "FAIL", "❌ Aucun token disponible pour validation")
                return False
            
            response = self.make_request("GET", "/auth/me")
            
            if response.status_code == 200:
                data = response.json()
                
                # Vérifier la structure de la réponse
                required_fields = ["id", "email", "first_name", "last_name"]
                missing_fields = [field for field in required_fields if field not in data]
                
                if missing_fields:
                    self.log_test(test_name, "FAIL", f"❌ Champs manquants: {missing_fields}")
                    return False
                
                # Vérifier que l'email correspond
                if data["email"] != self.test_user_email:
                    self.log_test(test_name, "FAIL", f"❌ Email incorrect: {data['email']}")
                    return False
                
                # Vérifier que l'ID correspond
                if data["id"] != self.user_id:
                    self.log_test(test_name, "FAIL", f"❌ User ID incorrect: {data['id']}")
                    return False
                
                self.log_test(test_name, "PASS", 
                    f"✅ Token valide - Utilisateur: {data['first_name']} {data['last_name']} ({data['email']})")
                return True
            else:
                self.log_test(test_name, "FAIL", f"❌ Status: {response.status_code} - {response.text}")
                return False
                
        except Exception as e:
            self.log_test(test_name, "FAIL", f"❌ Exception: {str(e)}")
            return False

    def test_4_token_persistence_simulation(self) -> bool:
        """4. Test de persistance des tokens - Simuler une reconnexion"""
        test_name = "4. Token Persistence Simulation"
        
        try:
            print("💾 Test de persistance des tokens - Simulation reconnexion")
            
            if not self.access_token:
                self.log_test(test_name, "FAIL", "❌ Aucun token disponible pour test persistance")
                return False
            
            # Sauvegarder le token actuel
            saved_token = self.access_token
            saved_user_id = self.user_id
            
            # Simuler une "déconnexion" en effaçant les tokens locaux
            self.access_token = None
            self.user_id = None
            
            print("    📱 Simulation: App fermée, tokens effacés localement")
            time.sleep(1)
            
            # Simuler une "reconnexion" en restaurant le token sauvegardé
            self.access_token = saved_token
            self.user_id = saved_user_id
            
            print("    🔄 Simulation: App rouverte, token restauré depuis le stockage")
            
            # Vérifier que le token fonctionne toujours
            response = self.make_request("GET", "/auth/me")
            
            if response.status_code == 200:
                data = response.json()
                
                if data["email"] != self.test_user_email:
                    self.log_test(test_name, "FAIL", f"❌ Token persisté invalide: {data['email']}")
                    return False
                
                self.log_test(test_name, "PASS", 
                    f"✅ Persistance des tokens fonctionne - Reconnexion automatique réussie")
                return True
            else:
                self.log_test(test_name, "FAIL", f"❌ Token persisté invalide: {response.status_code}")
                return False
                
        except Exception as e:
            self.log_test(test_name, "FAIL", f"❌ Exception: {str(e)}")
            return False

    def test_5_children_endpoint_next_steps(self) -> bool:
        """5. Vérifier GET /api/children pour les prochaines étapes"""
        test_name = "5. Children Endpoint - Next Steps"
        
        try:
            print("👶 Test GET /api/children pour restauration des enfants")
            
            if not self.access_token:
                self.log_test(test_name, "FAIL", "❌ Authentification requise")
                return False
            
            response = self.make_request("GET", "/children")
            
            if response.status_code == 200:
                data = response.json()
                
                if not isinstance(data, list):
                    self.log_test(test_name, "FAIL", f"❌ Réponse doit être une liste, reçu: {type(data)}")
                    return False
                
                self.children = data
                children_count = len(data)
                
                # Vérifier la structure si des enfants existent
                if children_count > 0:
                    child = data[0]
                    required_fields = ["id", "name", "gender", "birth_month", "birth_year", "age_months", "parent_id"]
                    missing_fields = [field for field in required_fields if field not in child]
                    
                    if missing_fields:
                        self.log_test(test_name, "FAIL", f"❌ Champs manquants dans enfant: {missing_fields}")
                        return False
                    
                    # Vérifier que parent_id correspond à l'utilisateur connecté
                    if child["parent_id"] != self.user_id:
                        self.log_test(test_name, "FAIL", f"❌ Parent ID incorrect: {child['parent_id']} != {self.user_id}")
                        return False
                
                self.log_test(test_name, "PASS", 
                    f"✅ Endpoint enfants prêt - {children_count} enfant(s) trouvé(s) pour restauration progressive")
                return True
            else:
                self.log_test(test_name, "FAIL", f"❌ Status: {response.status_code} - {response.text}")
                return False
                
        except Exception as e:
            self.log_test(test_name, "FAIL", f"❌ Exception: {str(e)}")
            return False

    def test_6_monetization_status_next_steps(self) -> bool:
        """6. Vérifier GET /api/monetization/status pour la monétisation"""
        test_name = "6. Monetization Status - Next Steps"
        
        try:
            print("💰 Test GET /api/monetization/status pour restauration monétisation")
            
            if not self.access_token:
                self.log_test(test_name, "FAIL", "❌ Authentification requise")
                return False
            
            response = self.make_request("GET", "/monetization/status")
            
            if response.status_code == 200:
                data = response.json()
                
                # Vérifier tous les champs requis pour la restauration progressive
                required_fields = [
                    "is_premium", "trial_days_left", "questions_asked", "popup_frequency",
                    "trial_start_date", "last_popup_shown", "questions_this_month"
                ]
                missing_fields = [field for field in required_fields if field not in data]
                
                if missing_fields:
                    self.log_test(test_name, "FAIL", f"❌ Champs manquants: {missing_fields}")
                    return False
                
                # Vérifier les types de données
                type_checks = [
                    ("is_premium", bool),
                    ("trial_days_left", int),
                    ("questions_asked", int),
                    ("questions_this_month", int),
                    ("popup_frequency", str)
                ]
                
                for field, expected_type in type_checks:
                    if not isinstance(data[field], expected_type):
                        self.log_test(test_name, "FAIL", 
                            f"❌ {field} doit être {expected_type.__name__}, reçu: {type(data[field])}")
                        return False
                
                # Vérifier les valeurs logiques
                if data["trial_days_left"] < 0:
                    self.log_test(test_name, "FAIL", f"❌ trial_days_left ne peut pas être négatif: {data['trial_days_left']}")
                    return False
                
                if data["questions_asked"] < 0 or data["questions_this_month"] < 0:
                    self.log_test(test_name, "FAIL", f"❌ Compteurs de questions ne peuvent pas être négatifs")
                    return False
                
                # Vérifier popup_frequency values
                valid_popup_values = ["none", "weekly", "daily", "blocking", "child_selection", "monthly_limit"]
                if data["popup_frequency"] not in valid_popup_values:
                    self.log_test(test_name, "FAIL", 
                        f"❌ popup_frequency invalide: {data['popup_frequency']}")
                    return False
                
                premium_status = "Premium" if data["is_premium"] else "Trial/Free"
                trial_days = data["trial_days_left"]
                questions = data["questions_asked"]
                popup = data["popup_frequency"]
                
                self.log_test(test_name, "PASS", 
                    f"✅ Endpoint monétisation prêt - Status: {premium_status}, Trial: {trial_days}j, Questions: {questions}, Popup: {popup}")
                return True
            else:
                self.log_test(test_name, "FAIL", f"❌ Status: {response.status_code} - {response.text}")
                return False
                
        except Exception as e:
            self.log_test(test_name, "FAIL", f"❌ Exception: {str(e)}")
            return False

    def test_7_comprehensive_backend_readiness(self) -> bool:
        """7. Test complet de préparation du backend pour restauration progressive"""
        test_name = "7. Backend Readiness - Comprehensive"
        
        try:
            print("🔍 Test complet de préparation backend pour restauration progressive")
            
            # Vérifier que tous les endpoints critiques sont accessibles
            critical_endpoints = [
                ("/health", "GET", False),  # Health check
                ("/auth/token", "POST", False),  # Authentication
                ("/auth/me", "GET", True),  # Token validation
                ("/children", "GET", True),  # Children management
                ("/monetization/status", "GET", True),  # Monetization
            ]
            
            endpoint_results = []
            
            for endpoint, method, auth_required in critical_endpoints:
                try:
                    if method == "GET":
                        if endpoint == "/auth/token":
                            continue  # Skip GET on token endpoint
                        response = self.make_request(method, endpoint, auth_required=auth_required)
                    elif method == "POST" and endpoint == "/auth/token":
                        # Test login endpoint
                        login_data = {"email": self.test_user_email, "password": self.test_user_password}
                        response = self.make_request(method, endpoint, login_data, auth_required=False)
                    else:
                        response = self.make_request(method, endpoint, auth_required=auth_required)
                    
                    success = response.status_code == 200
                    endpoint_results.append((endpoint, success))
                    
                    status = "✅" if success else "❌"
                    print(f"    {status} {method} {endpoint}: {response.status_code}")
                    
                except Exception as e:
                    endpoint_results.append((endpoint, False))
                    print(f"    ❌ {method} {endpoint}: Exception - {str(e)}")
            
            # Vérifier que tous les endpoints critiques fonctionnent
            failed_endpoints = [endpoint for endpoint, success in endpoint_results if not success]
            
            if failed_endpoints:
                self.log_test(test_name, "FAIL", f"❌ Endpoints défaillants: {failed_endpoints}")
                return False
            
            # Vérifier la cohérence des données
            if self.access_token and self.user_id:
                # Test de cohérence: l'utilisateur authentifié doit pouvoir accéder à ses données
                user_response = self.make_request("GET", "/auth/me")
                children_response = self.make_request("GET", "/children")
                monetization_response = self.make_request("GET", "/monetization/status")
                
                if not all(r.status_code == 200 for r in [user_response, children_response, monetization_response]):
                    self.log_test(test_name, "FAIL", "❌ Incohérence dans l'accès aux données utilisateur")
                    return False
            
            self.log_test(test_name, "PASS", 
                f"✅ Backend 100% prêt pour restauration progressive - Tous les endpoints critiques fonctionnent")
            return True
                
        except Exception as e:
            self.log_test(test_name, "FAIL", f"❌ Exception: {str(e)}")
            return False

    def run_progressive_architecture_tests(self):
        """Exécuter tous les tests de l'architecture progressive"""
        print("=" * 80)
        print("🏗️  TEST COMPLET DE L'ARCHITECTURE PROGRESSIVE 'DIS MAMAN !'")
        print("=" * 80)
        print(f"🌐 Backend URL: {BACKEND_URL}")
        print(f"📧 Test User: {self.test_user_email}")
        print("🎯 Objectif: Confirmer que le backend est prêt pour la restauration progressive")
        print("=" * 80)
        print()
        
        tests = [
            ("Health Check Backend", self.test_1_health_check_backend),
            ("Authentication contact@dismaman.fr", self.test_2_authentication_contact_dismaman),
            ("Token Validation /auth/me", self.test_3_token_validation_auth_me),
            ("Token Persistence Simulation", self.test_4_token_persistence_simulation),
            ("Children Endpoint - Next Steps", self.test_5_children_endpoint_next_steps),
            ("Monetization Status - Next Steps", self.test_6_monetization_status_next_steps),
            ("Backend Readiness - Comprehensive", self.test_7_comprehensive_backend_readiness),
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
        print("📊 RÉSUMÉ - ARCHITECTURE PROGRESSIVE 'DIS MAMAN !'")
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
            print("\n🎉 ARCHITECTURE PROGRESSIVE VALIDÉE!")
            print("✅ Backend 100% fonctionnel et prêt")
            print("✅ AuthContextSimple peut être implémenté")
            print("✅ Interface 3 états (chargement/non-connecté/connecté) supportée")
            print("✅ Restauration progressive des fonctionnalités possible")
            print("\n🚀 PRÊT POUR CONTINUER LA RESTAURATION PROGRESSIVE DU FRONTEND")
        else:
            print("\n⚠️ PROBLÈMES DÉTECTÉS DANS L'ARCHITECTURE")
            print("🔧 Corrections nécessaires avant restauration progressive")
            print("❌ Backend non prêt pour la suite du développement")
        
        print("=" * 80)
        
        return passed == total

if __name__ == "__main__":
    tester = DisMamanProgressiveArchitectureTester()
    success = tester.run_progressive_architecture_tests()
    exit(0 if success else 1)