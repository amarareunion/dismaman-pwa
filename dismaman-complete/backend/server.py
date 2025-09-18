from fastapi import FastAPI, APIRouter, HTTPException, Depends, status, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from passlib.context import CryptContext
from jose import JWTError, jwt
from datetime import datetime, timedelta
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional
from bson import ObjectId
from openai import OpenAI
from enum import Enum

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ.get('DB_NAME', 'dis_maman')]

# Security
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()

# JWT Configuration
SECRET_KEY = os.environ.get('SECRET_KEY', 'dis-maman-secret-key-2025')
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30
REFRESH_TOKEN_EXPIRE_DAYS = 7

# OpenAI Configuration
openai_api_key = os.environ.get('OPENAI_API_KEY')
openai_client = None
if openai_api_key:
    openai_client = OpenAI(api_key=openai_api_key)

# Create the main app
app = FastAPI(title="Dis Maman API", version="1.0.0")
api_router = APIRouter(prefix="/api")
# Health check endpoint for keep-alive
@app.get("/api/health")
async def health_check(request: Request):
    """
    Fast health check endpoint for keep-alive pings
    """
    headers = dict(request.headers)
    is_keep_alive = headers.get('x-keep-alive') == 'true'
    is_pre_warm = headers.get('x-pre-warm') == 'true'
    
    if is_keep_alive:
        print("💓 Keep-alive ping received")
    elif is_pre_warm:
        print("🔥 Pre-warm request received")
    
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "type": "keep-alive" if is_keep_alive else "pre-warm" if is_pre_warm else "health-check"
    }

# Enums
class Gender(str, Enum):
    BOY = "boy"
    GIRL = "girl"

class FeedbackType(str, Enum):
    UNDERSTOOD = "understood"
    TOO_COMPLEX = "too_complex"
    MORE_DETAILS = "more_details"

# Pydantic Models
class UserCreate(BaseModel):
    email: EmailStr
    password: str
    first_name: str
    last_name: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class User(BaseModel):
    id: str
    email: str
    first_name: str
    last_name: str
    is_premium: bool = False
    trial_end_date: Optional[datetime] = None
    created_at: datetime

class Child(BaseModel):
    id: str
    name: str
    gender: Gender
    birth_month: int  # 1-12
    birth_year: int
    complexity_level: int = 0  # -2 to 2, for AI adaptation
    age_months: int  # calculated field
    parent_id: str

class ChildCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=50)
    gender: Gender
    birth_month: int = Field(..., ge=1, le=12)
    birth_year: int = Field(..., ge=2000, le=datetime.now().year)
    complexity_level: int = Field(default=0, ge=-2, le=2)  # Nouveau champ pour l'adaptation IA

class QuestionRequest(BaseModel):
    question: str
    child_id: str

class FeedbackSubmission(BaseModel):
    response_id: str
    feedback: str = Field(..., pattern="^(understood|too_complex|need_more_details)$")

class ComplexityLevel(str, Enum):
    VERY_SIMPLE = "very_simple"
    SIMPLE = "simple"
    APPROPRIATE = "appropriate"
    DETAILED = "detailed"
    VERY_DETAILED = "very_detailed"

class Response(BaseModel):
    id: str
    question: str
    answer: str
    child_id: str
    child_name: str
    child_age_months: int
    created_at: datetime
    feedback: Optional[FeedbackType] = None

class FeedbackRequest(BaseModel):
    feedback: FeedbackType

class MonetizationStatus(BaseModel):
    is_premium: bool
    trial_days_left: int
    questions_asked: int
    popup_frequency: str  # "none", "weekly", "daily", "blocking"
    trial_start_date: str
    last_popup_shown: str
    subscription_type: Optional[str] = None  # "monthly" or "annual"
    questions_this_month: int = 0
    active_child_id: Optional[str] = None  # For free users after trial
    is_post_trial_setup_required: bool = False

# Utility Functions
def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: timedelta = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def create_refresh_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    user = await db.users.find_one({"_id": ObjectId(user_id)})
    if user is None:
        raise HTTPException(status_code=401, detail="User not found")
    
    return user

def calculate_age_months(birth_year: int, birth_month: int) -> int:
    """Calculate age in months"""
    now = datetime.now()
    age_months = (now.year - birth_year) * 12 + (now.month - birth_month)
    return max(0, age_months)

def calculate_child_age_years(birth_month: int, birth_year: int) -> float:
    """Calculate precise age in years for child"""
    now = datetime.now()
    age = now.year - birth_year
    if now.month < birth_month:
        age -= 1
    return age + (max(0, now.month - birth_month) / 12.0)

def get_complexity_descriptor(complexity_level: int, age: float) -> str:
    """Get complexity description based on level and base age"""
    base_age = max(3, min(age, 12))  # Clamp between 3-12 years
    
    if complexity_level <= -2:
        return f"très simple, comme pour un enfant de {max(3, int(base_age - 2))} ans, avec des mots très faciles"
    elif complexity_level == -1:
        return f"simple, comme pour un enfant de {max(3, int(base_age - 1))} ans, avec des explications courtes"
    elif complexity_level == 0:
        return f"adapté à un enfant de {int(base_age)} ans"
    elif complexity_level == 1:
        return f"plus détaillé avec des exemples concrets, comme pour un enfant de {min(12, int(base_age + 1))} ans qui veut approfondir"
    else:  # complexity_level >= 2
        return f"très détaillé avec des explications scientifiques et des exemples variés, comme pour un enfant de {min(12, int(base_age + 2))} ans qui est très curieux"

def get_complexity_instructions(complexity_level: int) -> str:
    """Get specific instructions for each complexity level"""
    if complexity_level <= -2:
        return """- Utilise des mots TRÈS simples (3-4 lettres maximum quand possible)
- Phrases TRÈS courtes (3-5 mots maximum)
- Répète les mots importants
- Utilise beaucoup d'onomatopées (boum, splash, miaou...)
- Donne des exemples très concrets et familiers
- Évite complètement les concepts abstraits"""
    elif complexity_level == -1:
        return """- Utilise un vocabulaire simple mais un peu plus riche
- Phrases courtes mais complètes (5-8 mots)
- Explique un seul concept à la fois
- Utilise des comparaisons avec des objets familiers
- Évite les détails techniques
- Reste très concret et visuel"""
    elif complexity_level == 0:
        return """- Utilise un vocabulaire adapté à l'âge
- Phrases de longueur normale (8-12 mots)
- Explique clairement mais sans trop de détails
- Utilise des exemples que l'enfant peut comprendre
- Introduis quelques mots nouveaux en les expliquant
- Équilibre entre simplicité et richesse"""
    elif complexity_level == 1:
        return """- Utilise un vocabulaire plus riche et varié
- Phrases plus longues et complexes
- Donne plus de détails et d'exemples
- Explique les "pourquoi" et les "comment"
- Introduis des concepts un peu plus avancés
- Encourage les questions de suivi"""
    else:  # complexity_level >= 2
        return """- Utilise un vocabulaire riche et précis
- Phrases complexes avec plusieurs idées
- Donne des explications détaillées et scientifiques
- Utilise des termes techniques en les expliquant
- Donne plusieurs exemples et contre-exemples
- Encourage la réflexion critique et les questions approfondies"""

def generate_advanced_system_message(child_name: str, child_gender: str, age: float, complexity_level: int = 0) -> str:
    """Generate sophisticated system message for OpenAI based on child characteristics with BALANCED CONTENT FILTERING"""
    
    # Calculate complexity description
    complexity_desc = get_complexity_descriptor(complexity_level, age)
    
    # Gender-based pronouns
    if child_gender == "girl":
        pronouns = {
            "il": "elle", "lui": "elle", "son": "sa",
            "petit": "petite", "curieux": "curieuse"
        }
        gender_text = "une fille"
    else:  # boy
        pronouns = {
            "il": "il", "lui": "lui", "son": "son",
            "petit": "petit", "curieux": "curieux"
        }
        gender_text = "un garçon"
    
    return f"""Tu es une assistante bienveillante qui répond aux questions des enfants avec une voix de maman rassurante. 

RÈGLE CRUCIALE - STRUCTURE DE RÉPONSE OBLIGATOIRE POUR SUJETS SCIENTIFIQUES/TECHNIQUES :
📚 POUR TOUTE QUESTION SCIENTIFIQUE/TECHNIQUE :
1. D'ABORD re-expliquer SIMPLEMENT les termes de la question 
2. ENSUITE donner l'explication adaptée à l'âge
3. TERMINER par une question pour encourager la curiosité

EXEMPLE OBLIGATOIRE :
Question: "Pourquoi un orage peut faire du feu ?"
Réponse: "{child_name}, laisse-moi t'expliquer ! Un orage, c'est quand il y a de gros nuages noirs dans le ciel avec de la pluie, du tonnerre et des éclairs. Les éclairs, ce sont des grosses étincelles électriques très puissantes qui descendent du ciel. Ces éclairs sont si chauds qu'ils peuvent allumer les arbres ou l'herbe sèche, comme une allumette géante ! C'est pour ça qu'on peut voir du feu après un orage. Est-ce que tu as déjà vu des éclairs dans le ciel {child_name} ?"

RÈGLES DE SÉCURITÉ ÉQUILIBRÉES (PRIORITÉ ABSOLUE):
⚠️ SUJETS INTERDITS - REDIRECTION OBLIGATOIRE VERS LES PARENTS :
- Violence, guerre, mort violente, meurtre, armes → "C'est une question importante {child_name}, mais je pense que papa ou maman pourra mieux t'expliquer cela. Demande-leur quand tu les verras !"
- Contenu sexuel explicite, pornographie, anatomie intime détaillée → "{child_name}, c'est une question que tes parents t'expliqueront mieux que moi. Va leur demander ma {pronouns["petit"]} !"
- Drogues, alcool, substances dangereuses → "Ma {pronouns["petit"]} {child_name}, c'est un sujet pour les grands. Tes parents pourront t'en parler quand tu seras plus grand{gender_text[4:] if gender_text == 'une fille' else ''}."

✅ ÉDUCATION SEXUELLE DE BASE AUTORISÉE avec vocabulaire familial :
- "Comment on fait les bébés ?" → Répondre avec vocabulaire simple et familial adapté à l'âge : "Quand un papa et une maman s'aiment très fort, ils peuvent créer ensemble un petit bébé qui grandit dans le ventre de maman pendant 9 mois. C'est un cadeau d'amour très spécial {child_name} !"
- Questions sur la naissance, la grossesse, les familles → Utiliser un vocabulaire doux et adapté à l'âge
- Différences entre garçons/filles → Réponses simples et respectueuses

INSTRUCTIONS PRINCIPALES:
- Réponds directement à l'enfant en utilisant son prénom "{child_name}"
- {child_name} est {gender_text} de {int(age)} ans
- Adapte ton langage pour qu'il soit {complexity_desc}
- Utilise les bons pronoms: {pronouns["il"]}, {pronouns["lui"]}, {pronouns["son"]} quand tu parles de {child_name}
- Encourage {pronouns["son"]} côté {pronouns["curieux"]} et créatif
- Utilise un ton chaleureux, rassurant et maternel

NIVEAU DE COMPLEXITÉ SPÉCIFIQUE:
{get_complexity_instructions(complexity_level)}

- Explique les choses de manière simple et imagée adaptée à {gender_text} de {int(age)} ans
- Évite les mots techniques compliqués sauf si le niveau le permet
- Termine souvent par une question ou encouragement pour stimuler la curiosité
- Adapte tes exemples selon le genre si pertinent (sans stéréotypes excessifs)

SÉCURITÉ ENFANT:
- JAMAIS de détails explicites ou choquants
- Vocabulaire familial et rassurant pour l'éducation sexuelle de base
- Toujours protéger l'innocence tout en éduquant de façon appropriée
- Rester positif et éducatif"""

def get_age_appropriate_prompt(age_months: int) -> str:
    """Get OpenAI prompt based on child's age - LEGACY FUNCTION"""
    if age_months < 36:  # 0-3 years
        return "Tu es un assistant qui répond aux questions d'enfants de 0-3 ans. Utilise des mots très simples, des phrases courtes (3-5 mots), et sois très concret. Évite les concepts abstraits."
    elif age_months < 72:  # 3-6 years
        return "Tu es un assistant qui répond aux questions d'enfants de 3-6 ans. Utilise un vocabulaire simple mais plus riche, des phrases de 5-8 mots, et donne des exemples concrets qu'ils peuvent comprendre."
    elif age_months < 120:  # 6-10 years
        return "Tu es un assistant qui répond aux questions d'enfants de 6-10 ans. Tu peux utiliser un vocabulaire plus avancé, expliquer des concepts plus complexes, mais reste toujours bienveillant et encourage la curiosité."
    else:  # 10+ years
        return "Tu es un assistant qui répond aux questions d'enfants de 10+ ans. Tu peux aborder des sujets plus complexes, utiliser un vocabulaire riche, et encourager la réflexion critique tout en restant adapté à leur âge."

# Authentication Routes
@api_router.post("/auth/register")
async def register(user_data: UserCreate):
    # Check if user already exists
    existing_user = await db.users.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create new user with 30-day trial
    hashed_password = get_password_hash(user_data.password)
    trial_end_date = datetime.utcnow() + timedelta(days=30)
    
    new_user = {
        "email": user_data.email,
        "password": hashed_password,
        "first_name": user_data.first_name,
        "last_name": user_data.last_name,
        "is_premium": False,
        "trial_end_date": trial_end_date,
        "created_at": datetime.utcnow(),
        "questions_asked": 0,
        "popup_count": 0
    }
    
    result = await db.users.insert_one(new_user)
    user_id = str(result.inserted_id)
    
    # Create tokens
    access_token = create_access_token(data={"sub": user_id})
    refresh_token = create_refresh_token(data={"sub": user_id})
    
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "user": {
            "id": user_id,
            "email": user_data.email,
            "first_name": user_data.first_name,
            "last_name": user_data.last_name
        }
    }

@api_router.post("/auth/token")
async def login(user_data: UserLogin):
    user = await db.users.find_one({"email": user_data.email})
    if not user or not verify_password(user_data.password, user["password"]):
        raise HTTPException(status_code=401, detail="Incorrect email or password")
    
    user_id = str(user["_id"])
    access_token = create_access_token(data={"sub": user_id})
    refresh_token = create_refresh_token(data={"sub": user_id})
    
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "user": {
            "id": user_id,
            "email": user["email"],
            "first_name": user["first_name"],
            "last_name": user["last_name"]
        }
    }

@api_router.post("/auth/refresh")
async def refresh_token(refresh_token: str):
    try:
        payload = jwt.decode(refresh_token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid refresh token")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid refresh token")
    
    new_access_token = create_access_token(data={"sub": user_id})
    return {"access_token": new_access_token, "token_type": "bearer"}

@api_router.get("/auth/me")
async def get_current_user_info(current_user = Depends(get_current_user)):
    return {
        "id": str(current_user["_id"]),
        "email": current_user["email"],
        "first_name": current_user["first_name"],
        "last_name": current_user["last_name"],
        "is_premium": current_user.get("is_premium", False),
        "trial_end_date": current_user.get("trial_end_date")
    }

# Children Management Routes
@api_router.get("/children")
async def get_children(current_user = Depends(get_current_user)):
    user_id = str(current_user["_id"])
    children = await db.children.find({"parent_id": user_id}).to_list(4)
    
    result = []
    for child in children:
        age_months = calculate_age_months(child["birth_year"], child["birth_month"])
        result.append({
            "id": str(child["_id"]),
            "name": child["name"],
            "gender": child["gender"],
            "birth_month": child["birth_month"],
            "birth_year": child["birth_year"],
            "complexity_level": child.get("complexity_level", 0),
            "age_months": age_months,
            "parent_id": user_id
        })
    
    return result

@api_router.post("/children")
async def create_child(child_data: ChildCreate, current_user = Depends(get_current_user)):
    user_id = str(current_user["_id"])
    
    # Check if user already has 4 children
    children_count = await db.children.count_documents({"parent_id": user_id})
    if children_count >= 4:
        raise HTTPException(status_code=400, detail="Maximum 4 children allowed")
    
    new_child = {
        "name": child_data.name,
        "gender": child_data.gender,
        "birth_month": child_data.birth_month,
        "birth_year": child_data.birth_year,
        "complexity_level": child_data.complexity_level,
        "parent_id": user_id,
        "created_at": datetime.utcnow()
    }
    
    result = await db.children.insert_one(new_child)
    child_id = str(result.inserted_id)
    age_months = calculate_age_months(child_data.birth_year, child_data.birth_month)
    
    return {
        "id": child_id,
        "name": child_data.name,
        "gender": child_data.gender,
        "birth_month": child_data.birth_month,
        "birth_year": child_data.birth_year,
        "complexity_level": child_data.complexity_level,
        "age_months": age_months,
        "parent_id": user_id
    }

@api_router.delete("/children/{child_id}")
async def delete_child(child_id: str, current_user = Depends(get_current_user)):
    user_id = str(current_user["_id"])
    
    result = await db.children.delete_one({
        "_id": ObjectId(child_id),
        "parent_id": user_id
    })
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Child not found")
    
    return {"message": "Child deleted successfully"}

# Questions & Responses Routes
@api_router.post("/questions")
async def ask_question(request: QuestionRequest, current_user = Depends(get_current_user)):
    user_id = str(current_user["_id"])
    
    # Get child information
    child = await db.children.find_one({
        "_id": ObjectId(request.child_id),
        "parent_id": user_id
    })
    
    if not child:
        raise HTTPException(status_code=404, detail="Child not found")
    
    # Check monetization limits - NEW SYSTEM
    is_premium = current_user.get("is_premium", False)
    trial_end_date = current_user.get("trial_end_date")
    is_trial_active = trial_end_date and datetime.utcnow() < trial_end_date
    active_child_id = current_user.get("active_child_id")
    
    # Calculate questions this month
    start_of_month = datetime.utcnow().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    questions_this_month = await db.responses.count_documents({
        "user_id": user_id,
        "created_at": {"$gte": start_of_month}
    })
    
    if not is_premium and not is_trial_active:
        # Post-trial free user limitations
        
        # Check if trying to use non-active child
        if active_child_id and str(child["_id"]) != active_child_id:
            raise HTTPException(status_code=402, detail="Child not active in free version")
        
        # Check monthly question limit (1 question per month)
        if questions_this_month >= 1:
            raise HTTPException(status_code=402, detail="Monthly question limit reached")
    
    # Calculate child's age precisely and get advanced system message
    age_years = calculate_child_age_years(child["birth_month"], child["birth_year"])
    age_months = calculate_age_months(child["birth_year"], child["birth_month"])  # Still needed for database
    complexity_level = child.get("complexity_level", 0)
    
    # Generate sophisticated system message
    system_message = generate_advanced_system_message(
        child["name"], 
        child["gender"], 
        age_years, 
        complexity_level
    )
    
    # Generate AI response using OpenAI GPT-5 (fallback to GPT-4o if GPT-5 not available)
    try:
        if openai_client:
            # Try GPT-5 first, fallback to GPT-4o if not available
            try:
                response = openai_client.chat.completions.create(
                    model="gpt-5",  # Upgraded to GPT-5 for enhanced reasoning and capabilities
                    messages=[
                        {"role": "system", "content": system_message},
                        {"role": "user", "content": request.question}
                    ],
                    max_completion_tokens=300  # Updated for GPT-5 compatibility
                )
                ai_answer = response.choices[0].message.content
                logger.info(f"GPT-5 response received: {len(ai_answer) if ai_answer else 0} characters")
                if not ai_answer or len(ai_answer.strip()) == 0:
                    logger.warning("GPT-5 returned empty response, falling back to GPT-4o")
                    raise Exception("Empty response from GPT-5")
            except Exception as gpt5_error:
                logger.error(f"GPT-5 not available, falling back to GPT-4o: {gpt5_error}")
                # Fallback to GPT-4o with original parameters
                response = openai_client.chat.completions.create(
                    model="gpt-4o",
                    messages=[
                        {"role": "system", "content": system_message},
                        {"role": "user", "content": request.question}
                    ],
                    max_tokens=300,
                    temperature=0.7
                )
                ai_answer = response.choices[0].message.content
                logger.info(f"GPT-4o fallback response received: {len(ai_answer) if ai_answer else 0} characters")
        else:
            # Enhanced fallback response with child name
            ai_answer = f"Bonjour {child['name']}, je n'ai pas pu répondre à ta question pour le moment. Peux-tu me la redemander ?"
    
    except Exception as e:
        logger.error(f"OpenAI API error: {e}")
        ai_answer = f"Bonjour {child['name']}, je n'ai pas pu répondre à ta question pour le moment. Peux-tu me la redemander ?"
    
    # Save response to database
    new_response = {
        "question": request.question,
        "answer": ai_answer,
        "child_id": request.child_id,
        "child_name": child["name"],
        "child_age_months": age_months,
        "parent_id": user_id,
        "created_at": datetime.utcnow(),
        "feedback": None
    }
    
    result = await db.responses.insert_one(new_response)
    response_id = str(result.inserted_id)
    
    # Update user's question count
    await db.users.update_one(
        {"_id": ObjectId(user_id)},
        {"$inc": {"questions_asked": 1}}
    )
    
    return {
        "id": response_id,
        "question": request.question,
        "answer": ai_answer,
        "child_id": request.child_id,
        "child_name": child["name"],
        "child_age_months": age_months,
        "created_at": datetime.utcnow()
    }

# Removed duplicate feedback endpoint - using the sophisticated one below

@api_router.get("/responses/child/{child_id}")
async def get_child_responses(child_id: str, current_user = Depends(get_current_user)):
    user_id = str(current_user["_id"])
    
    responses = await db.responses.find({
        "child_id": child_id,
        "parent_id": user_id
    }).sort("created_at", -1).limit(20).to_list(20)
    
    result = []
    for response in responses:
        result.append({
            "id": str(response["_id"]),
            "question": response["question"],
            "answer": response["answer"],
            "child_name": response["child_name"],
            "created_at": response["created_at"],
            "feedback": response.get("feedback")
        })
    
    return result

# Monetization Routes
@api_router.get("/monetization/status")
async def get_monetization_status(current_user = Depends(get_current_user)):
    user_id = str(current_user["_id"])
    is_premium = current_user.get("is_premium", False)
    subscription_type = current_user.get("subscription_type")
    trial_end_date = current_user.get("trial_end_date")
    trial_start_date = current_user.get("trial_start_date", datetime.utcnow())
    active_child_id = current_user.get("active_child_id")
    
    # Calculate trial days left
    trial_days_left = 0
    if trial_end_date and datetime.utcnow() < trial_end_date:
        trial_days_left = (trial_end_date - datetime.utcnow()).days
    
    # Calculate questions this month
    start_of_month = datetime.utcnow().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    questions_this_month = await db.responses.count_documents({
        "user_id": user_id,
        "created_at": {"$gte": start_of_month}
    })
    
    # Determine if post-trial setup is required
    is_post_trial_setup_required = False
    if not is_premium and trial_days_left <= 0 and not active_child_id:
        # Trial ended but no child selected yet
        is_post_trial_setup_required = True
    
    # Determine popup frequency
    popup_frequency = "none"
    if not is_premium:
        if trial_days_left <= 0:
            if is_post_trial_setup_required:
                popup_frequency = "child_selection"
            elif questions_this_month >= 1:
                popup_frequency = "monthly_limit"
            else:
                popup_frequency = "none"
        else:
            # Still in trial
            popup_frequency = "none"
    
    return {
        "is_premium": is_premium,
        "trial_days_left": trial_days_left,
        "questions_asked": questions_this_month,  # Legacy field for compatibility
        "questions_this_month": questions_this_month,
        "popup_frequency": popup_frequency,
        "trial_start_date": trial_start_date.isoformat() if isinstance(trial_start_date, datetime) else str(trial_start_date),
        "last_popup_shown": current_user.get("last_popup_shown", ""),
        "subscription_type": subscription_type,
        "active_child_id": active_child_id,
        "is_post_trial_setup_required": is_post_trial_setup_required
    }

@api_router.post("/monetization/popup-shown")
async def track_popup_shown(current_user = Depends(get_current_user)):
    user_id = str(current_user["_id"])
    
    await db.users.update_one(
        {"_id": ObjectId(user_id)},
        {"$inc": {"popup_count": 1}}
    )
    
    return {"message": "Popup tracking recorded"}

@api_router.post("/monetization/select-active-child")
async def select_active_child(
    child_id: str, 
    current_user = Depends(get_current_user)
):
    """Select which child remains active for free users after trial ends"""
    user_id = str(current_user["_id"])
    
    # Verify the child belongs to the user
    child = await db.children.find_one({
        "_id": ObjectId(child_id),
        "parent_id": user_id
    })
    
    if not child:
        raise HTTPException(status_code=404, detail="Child not found")
    
    # Update user with selected active child
    await db.users.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": {"active_child_id": child_id}}
    )
    
    return {"message": "Active child selected", "active_child_id": child_id}

@api_router.post("/monetization/subscribe")
async def subscribe_premium(
    subscription_type: str,  # "monthly" or "annual"
    transaction_id: str,
    current_user = Depends(get_current_user)
):
    """Handle premium subscription"""
    user_id = str(current_user["_id"])
    
    if subscription_type not in ["monthly", "annual"]:
        raise HTTPException(status_code=400, detail="Invalid subscription type")
    
    # Calculate subscription end date
    if subscription_type == "monthly":
        end_date = datetime.utcnow() + timedelta(days=30)
        price = "5.99€"
    else:  # annual
        end_date = datetime.utcnow() + timedelta(days=365)
        price = "59.90€"
    
    # Update user subscription
    await db.users.update_one(
        {"_id": ObjectId(user_id)},
        {
            "$set": {
                "is_premium": True,
                "subscription_type": subscription_type,
                "subscription_end_date": end_date,
                "transaction_id": transaction_id,
                "active_child_id": None  # Remove child limitation
            }
        }
    )
    
    return {
        "message": "Subscription successful",
        "subscription_type": subscription_type,
        "price": price,
        "end_date": end_date.isoformat()
    }
    
    # In a real app, you'd validate the in-app purchase here
    # For now, we'll just mark the user as premium
    await db.users.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": {"is_premium": True, "premium_start_date": datetime.utcnow()}}
    )
    
    return {"message": "Premium subscription activated"}

# Feedback & Adaptive AI Routes
@api_router.post("/responses/{response_id}/feedback")
async def submit_feedback(response_id: str, feedback: FeedbackSubmission, current_user = Depends(get_current_user)):
    user_id = str(current_user["_id"])
    
    # Check if feedback buttons are available (premium feature after trial)
    is_premium = current_user.get("is_premium", False)
    trial_end_date = current_user.get("trial_end_date")
    is_trial_active = trial_end_date and datetime.utcnow() < trial_end_date
    
    # Block feedback buttons for non-premium users after trial
    if not is_premium and not is_trial_active and feedback.feedback in ["too_complex", "need_more_details"]:
        raise HTTPException(status_code=402, detail="Feedback buttons available in premium version only")
    
    # Find the response
    response_doc = await db.responses.find_one({
        "_id": ObjectId(response_id),
        "parent_id": user_id
    })
    
    if not response_doc:
        raise HTTPException(status_code=404, detail="Response not found")
    
    # Get the child
    child = await db.children.find_one({
        "_id": ObjectId(response_doc["child_id"]),
        "parent_id": user_id
    })
    
    if not child:
        raise HTTPException(status_code=404, detail="Child not found")
    
    # Determine complexity change based on feedback
    complexity_change = 0
    regenerate = False
    
    if feedback.feedback == "too_complex":
        complexity_change = -1  # Make it simpler
        regenerate = True
    elif feedback.feedback == "need_more_details":
        complexity_change = 1   # Make it more detailed
        regenerate = True
    elif feedback.feedback == "understood":
        # Perfect level, just record the feedback
        pass
    
    # Update child's complexity level if needed
    if complexity_change != 0:
        current_level = child.get("complexity_level", 0)
        new_level = max(-2, min(2, current_level + complexity_change))  # Clamp between -2 and +2
        
        await db.children.update_one(
            {"_id": ObjectId(response_doc["child_id"])},
            {"$set": {"complexity_level": new_level}}
        )
        
        child["complexity_level"] = new_level
    
    # Update response with feedback
    await db.responses.update_one(
        {"_id": ObjectId(response_id)},
        {"$set": {"feedback": feedback.feedback, "feedback_timestamp": datetime.utcnow()}}
    )
    
    result = {"success": True, "regenerate": regenerate}
    
    # Regenerate response if needed
    if regenerate:
        try:
            # Calculate age and generate new response
            age_years = calculate_child_age_years(child["birth_month"], child["birth_year"])
            
            if feedback.feedback == "need_more_details":
                # Special handling for "Plus d'infos": keep original response and add section
                enhanced_system_message = f"""Tu es un expert pédagogue qui va ajouter une section "Plus d'infos" très enrichissante pour {child["name"]}.

OBJECTIF : Ajouter des explications approfondies et ludiques.

TON ET STYLE :
- Enthousiaste et accessible
- Utilise le prénom de l'enfant ({child["name"]})
- Explications détaillées mais claires
- Analogies concrètes et exemples du quotidien
- Phrases comme "Tu sais {child["name"]}", "Figure-toi {child["name"]}"
- Conclusion motivante

FORMAT EXACT :
[Contenu original exactement identique]

## 🧠 Plus d'infos pour {child["name"]} !

[Contenu style pédagogique avec explications approfondies]
"""

                # Generate the "Plus d'infos" section with enhanced pedagogical tone
                try:
                    response = openai_client.chat.completions.create(
                        model="gpt-5",
                        messages=[
                            {"role": "system", "content": enhanced_system_message},
                            {"role": "user", "content": f"Ajoute une section 'Plus d'infos' pédagogique pour cette question : {response_doc['question']}"}
                        ],
                        max_completion_tokens=400
                    )
                    plus_infos_section = response.choices[0].message.content
                    
                    # Check if GPT-5 returned empty response
                    if not plus_infos_section or len(plus_infos_section.strip()) == 0:
                        logger.warning("GPT-5 returned empty response for Plus d'infos, falling back to GPT-4o")
                        raise Exception("Empty response from GPT-5")
                        
                except Exception as gpt5_error:
                    logger.error(f"GPT-5 not available for Plus d'infos, falling back to GPT-4o: {gpt5_error}")
                    # Fallback to GPT-4o for Plus d'infos section
                    response = openai_client.chat.completions.create(
                        model="gpt-4o",
                        messages=[
                            {"role": "system", "content": enhanced_system_message},
                            {"role": "user", "content": f"Ajoute une section 'Plus d'infos' pédagogique pour cette question : {response_doc['question']}"}
                        ],
                        max_tokens=400,
                        temperature=0.8
                    )
                    plus_infos_section = response.choices[0].message.content
                
                # Combine original response with Plus d'infos section
                original_response = response_doc["answer"]
                new_answer = f"{original_response}\n\n{plus_infos_section}"
                logger.info(f"Plus d'infos section generated: {len(plus_infos_section)} characters")
                
            else:
                # Regular regeneration for "too_complex" - completely regenerate
                system_message = generate_advanced_system_message(
                    child["name"], 
                    child["gender"], 
                    age_years, 
                    child.get("complexity_level", 0)
                )
                
                # Try GPT-5 first, fallback to GPT-4o if not available
                try:
                    response = openai_client.chat.completions.create(
                        model="gpt-5",
                        messages=[
                            {"role": "system", "content": system_message},
                            {"role": "user", "content": response_doc["question"]}
                        ],
                        max_completion_tokens=300
                    )
                    new_answer = response.choices[0].message.content
                    
                    # Check if GPT-5 returned empty response
                    if not new_answer or len(new_answer.strip()) == 0:
                        logger.warning("GPT-5 returned empty response for regeneration, falling back to GPT-4o")
                        raise Exception("Empty response from GPT-5")
                        
                except Exception as gpt5_error:
                    logger.error(f"GPT-5 not available for regeneration, falling back to GPT-4o: {gpt5_error}")
                    # Fallback to GPT-4o
                    response = openai_client.chat.completions.create(
                        model="gpt-4o",
                        messages=[
                            {"role": "system", "content": system_message},
                            {"role": "user", "content": response_doc["question"]}
                        ],
                    max_tokens=300,
                    temperature=0.7
                )
                new_answer = response.choices[0].message.content
            
            # If still no answer after fallback
            if not new_answer or len(new_answer.strip()) == 0:
                new_answer = f"Bonjour {child['name']}, je n'ai pas pu régénérer ma réponse. Peux-tu me redemander ?"
            
            # Update the response with new answer
            await db.responses.update_one(
                {"_id": ObjectId(response_id)},
                {"$set": {"answer": new_answer, "regenerated": True, "regenerated_timestamp": datetime.utcnow()}}
            )
            
            result["new_response"] = {
                "id": response_id,
                "question": response_doc["question"],
                "answer": new_answer,
                "child_id": response_doc["child_id"],
                "child_name": child["name"],
                "complexity_level": child.get("complexity_level", 0)
            }
            
        except Exception as e:
            logger.error(f"Error regenerating response: {e}")
            result["regenerate"] = False
            result["error"] = "Could not regenerate response"
    
    return result

@api_router.get("/children/{child_id}/complexity")
async def get_child_complexity(child_id: str, current_user = Depends(get_current_user)):
    user_id = str(current_user["_id"])
    
    child = await db.children.find_one({
        "_id": ObjectId(child_id),
        "parent_id": user_id
    })
    
    if not child:
        raise HTTPException(status_code=404, detail="Child not found")
    
    return {
        "child_id": child_id,
        "complexity_level": child.get("complexity_level", 0),
        "name": child["name"],
        "age_years": calculate_child_age_years(child["birth_month"], child["birth_year"])
    }

# Admin endpoint for database access (add before including router)
@api_router.get("/admin/users")
async def get_all_users(current_user: dict = Depends(get_current_user)):
    """Get all registered users (admin access)"""
    try:
        # Simple admin check - only allow specific admin emails
        admin_emails = ['amarareunion@icloud.com', 'test@dismaman.fr']
        if current_user.get('email') not in admin_emails:
            raise HTTPException(status_code=403, detail="Admin access required")
        
        # Get all users
        users = await db.users.find({}, {"password": 0}).to_list(None)
        
        user_stats = []
        for user in users:
            user_id = str(user['_id'])
            
            # Count children
            children_count = await db.children.count_documents({"parent_id": user_id})
            
            # Count questions
            questions_count = await db.responses.count_documents({"parent_id": user_id})
            
            # Get subscription status
            subscription = await db.subscriptions.find_one({"user_id": user_id})
            is_premium = subscription and subscription.get('status') == 'active'
            
            user_stats.append({
                "id": user_id,
                "email": user['email'],
                "first_name": user.get('first_name', ''),
                "last_name": user.get('last_name', ''),
                "created_at": user.get('created_at'),
                "trial_start": user.get('trial_start'),
                "children_count": children_count,
                "questions_count": questions_count,
                "is_premium": is_premium,
                "subscription_type": subscription.get('type') if subscription else None
            })
        
        return {
            "total_users": len(user_stats),
            "users": user_stats
        }
        
    except Exception as e:
        logging.error(f"Admin users error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Test utilities endpoint (temporary for debugging)
@app.post("/api/debug/reset-test-account")
async def reset_test_account():
    """Temporary endpoint to reset test account for debugging"""
    try:
        # Find test user
        user = await db.users.find_one({"email": "test@dismaman.fr"})
        if not user:
            raise HTTPException(status_code=404, detail="Test user not found")
        
        # Update user to premium with extended trial
        from datetime import datetime, timedelta
        trial_end = datetime.utcnow() + timedelta(days=30)
        
        await db.users.update_one(
            {"email": "test@dismaman.fr"},
            {
                "$set": {
                    "is_premium": True,
                    "trial_end_date": trial_end,
                    "questions_asked": 0,
                    "subscription_status": "trial",
                    "active_child_id": None,
                    "is_post_trial_setup_required": False
                }
            }
        )
        
        logger.info("Test account reset successfully")
        return {
            "message": "Test account reset to premium with 30-day trial",
            "is_premium": True,
            "trial_days_left": 30,
            "email": "test@dismaman.fr"
        }
        
    except Exception as e:
        logger.error(f"Error resetting test account: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# Test endpoint to simulate post-trial user with multiple children
@app.post("/api/debug/simulate-post-trial")
async def simulate_post_trial():
    """Simulate a post-trial user with multiple children needing selection"""
    try:
        from datetime import datetime, timedelta
        
        # Set user to post-trial (expired)
        expired_date = datetime.utcnow() - timedelta(days=5)
        
        await db.users.update_one(
            {"email": "test@dismaman.fr"},
            {
                "$set": {
                    "is_premium": False,
                    "trial_end_date": expired_date,
                    "questions_asked": 0,
                    "subscription_status": "free",
                    "active_child_id": None,
                    "is_post_trial_setup_required": True
                }
            }
        )
        
        # Ensure we have multiple children for selection
        user = await db.users.find_one({"email": "test@dismaman.fr"})
        children_count = await db.children.count_documents({"parent_id": user["_id"]})
        
        if children_count < 2:
            # Add sample children if needed
            from bson import ObjectId
            await db.children.insert_many([
                {
                    "parent_id": user["_id"],
                    "name": "Emma",
                    "birth_month": 3,
                    "birth_year": 2018,
                    "gender": "girl",
                    "age_months": 75
                },
                {
                    "parent_id": user["_id"],
                    "name": "Lucas",
                    "birth_month": 8,
                    "birth_year": 2020,
                    "gender": "boy", 
                    "age_months": 53
                }
            ])
        
        return {
            "message": "User simulated as post-trial with child selection required",
            "is_premium": False,
            "trial_days_left": -5,
            "children_count": await db.children.count_documents({"parent_id": user["_id"]}),
            "needs_child_selection": True
        }
        
    except Exception as e:
        logger.error(f"Error simulating post-trial user: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))