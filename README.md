 🥗 AI-Powered Food Freshness & Expiry Estimator

A computer vision-driven mobile application designed to reduce food waste and improve consumer safety.  
By leveraging deep learning and image recognition, the app analyzes fruits, vegetables, and packaged food items to deliver real-time freshness classification and shelf-life estimation.
 

---

 🧠 Core Features

 🧾 Intelligent Food Classification
- Detects and identifies a wide variety of fruits, vegetables, and packaged food items
- Powered by deep learning-based image recognition models

 ⏳ Predictive Freshness Analytics
- Estimates remaining shelf life of food items
- Helps users make timely consumption decisions to reduce waste

 ⚠️ Risk Assessment System
- Classifies food into:
  - ✅ Safe  
  - ⚠️ Moderate  
  - ❌ Unsafe  
- Ensures better health and consumption awareness

📱 Mobile-First Experience
- Optimized for quick scanning and real-time results
- Simple and intuitive Android UI for everyday use


 🛠 Tech Stack

 Category             Technology 

 Mobile Development   Java, Android SDK 
 Machine Learning     TensorFlow, Keras 
 Computer Vision      OpenCV 
 Backend (Optional)   FastAPI / Node.js 
 Tools & Versioning   Git, Android Studio 


 🏗 System Architecture

The application follows a modular AI pipeline for efficient processing:

📸 Image Acquisition
Captures real-time images of food items using the mobile camera.

 🧹 Preprocessing Layer
- Image resizing and normalization  
- Noise reduction and formatting for model compatibility  

 🤖 Inference Engine
- Convolutional Neural Network (CNN) processes visual features  
- Classifies food type and condition
⏱ Expiry Estimation Module
- Predicts freshness duration using model confidence and decay-based logic  
- Enhances prediction reliability with heuristic adjustments

📊 User Interface Layer
- Displays results instantly in a clean, actionable format  
- Provides clear safety and freshness indicators  


 📦 Prerequisites
- Android Studio (latest stable version)
- JDK 8 or higher
- Android device (API Level 24+) or Emulator
