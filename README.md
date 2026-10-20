# AirIQ – Next-Hour PM2.5 Air Quality Forecasting System

## IT3051 – Fundamentals of Data Mining
### Mini Project 2026

AirIQ is an end-to-end Data Mining and Machine Learning system designed to predict the **next-hour PM2.5 concentration** at Beijing air-quality monitoring stations.

The system combines a trained Random Forest regression model with live air-quality and meteorological data to provide a user-friendly next-hour PM2.5 forecast.

---

## 1. Project Overview

Air pollution levels vary over time and across monitoring locations. Short-term PM2.5 forecasting can help users understand expected near-future air-quality conditions.

AirIQ addresses this problem by predicting:

> **PM2.5 concentration at the next hour (t+1)**

for a selected Beijing monitoring station.

The project follows the complete Data Mining workflow:

```text
Problem Definition
        ↓
Dataset Identification
        ↓
Dataset Integration
        ↓
Data Verification
        ↓
Exploratory Data Analysis
        ↓
Preprocessing
        ↓
Feature Engineering
        ↓
Leakage-Safe Validation
        ↓
Baseline Model
        ↓
Multiple ML Models
        ↓
Model Comparison
        ↓
Hyperparameter Tuning
        ↓
Final Model Selection
        ↓
Backend Development
        ↓
Frontend Development
        ↓
System Testing
        ↓
Next-Hour PM2.5 Prediction
```

---

## 2. Problem Definition

### Problem

Predict the PM2.5 concentration for the next hour using information available up to the current prediction point.

### Machine Learning Task

**Regression**

### Target Variable

```text
target_PM25 = PM2.5 at the next hour (t+1)
```

### Expected Output

A numerical PM2.5 prediction in:

```text
µg/m³
```

Example:

```text
Predicted next-hour PM2.5: 76.99 µg/m³
```

---

## 3. Dataset

### Dataset

**Beijing Multi-Site Air Quality**

### Original Source

UCI Machine Learning Repository

Dataset DOI:

https://doi.org/10.24432/C5RK5G

### Dataset Characteristics

- 420,768 hourly observations
- 12 monitoring stations
- 18 original variables
- Period: March 2013 – February 2017
- Six major air pollutants
- Meteorological variables
- Wind information

### Monitoring Stations

```text
Aotizhongxin
Changping
Dingling
Dongsi
Guanyuan
Gucheng
Huairou
Nongzhanguan
Shunyi
Tiantan
Wanliu
Wanshouxigong
```

---

## 4. Data Mining Workflow

### Data Integration

The original station-level CSV files were integrated into a canonical dataset containing all 12 monitoring stations.

### Data Verification

The integrated dataset was checked for:

- Duplicate records
- Duplicate station-hour combinations
- Invalid timestamps
- Date-component mismatches
- Invalid hours
- Unexpected stations
- Unexpected wind directions
- Negative measurements
- Non-numeric values
- Missing hourly timestamps

The verification confirmed that the station data could be integrated consistently.

---

## 5. Exploratory Data Analysis

EDA investigated:

- Distribution of pollutant variables
- Weather variables
- Missing values
- Outliers
- Temporal patterns
- Station-level variation
- Relationships between current and future PM2.5

Approximately 9.17% of rows contained at least one missing predictor value.

The project uses model-development preprocessing rather than deleting observations simply because they contain extreme pollution values, since high pollution measurements may represent genuine environmental events.

---

## 6. Target Construction

The prediction target was created using the next hourly PM2.5 value for the same monitoring station.

Conceptually:

```text
Current Hour (t)
       ↓
Available Features
       ↓
Next Hour (t+1)
       ↓
Target PM2.5
```

The target construction verifies that the target belongs to the same station and represents exactly the following hour.

The final record of each station does not have a next-hour target and is therefore excluded from target-based training/evaluation.

---

## 7. Feature Engineering

The final model uses **33 input features**.

### Current Environmental Features

- PM2.5
- PM10
- SO2
- NO2
- CO
- O3
- TEMP
- PRES
- DEWP
- RAIN
- WSPM

### Categorical Features

- Wind direction
- Monitoring station
- Season

### Temporal Features

- Year
- Month
- Day
- Hour
- Day of week
- Weekend indicator
- Sine/cosine hour encoding

### Historical PM2.5 Features

Lag features:

```text
1 hour
2 hours
3 hours
6 hours
12 hours
24 hours
```

Rolling features:

```text
3-hour mean
6-hour mean
24-hour mean
6-hour standard deviation
24-hour standard deviation
```

Lag and rolling features are constructed causally so that future information is not used.

---

## 8. Validation Strategy

Because the data is time-series data, random shuffling was avoided.

An expanding-window validation strategy was used:

```text
Fold 1:
Train → 2013
Validate → 2014

Fold 2:
Train → 2013–2014
Validate → 2015

Fold 3:
Train → 2013–2015
Validate → 2016

Final Test:
2017
```

The 2017 period was kept as an untouched final holdout set.

---

## 9. Models Compared

The following regression algorithms were implemented and compared:

1. Linear Regression
2. Decision Tree
3. Random Forest
4. HistGradientBoosting

Evaluation metrics:

- MAE
- RMSE
- R²

---

## 10. Model Comparison

The Random Forest achieved the best performance among the evaluated machine learning models during walk-forward validation.

### Validation Results

| Model | Mean MAE | Mean RMSE | Mean R² |
|---|---:|---:|---:|
| Linear Regression | 13.2784 | 26.3649 | 0.8906 |
| Decision Tree | 13.7251 | 26.3039 | 0.8911 |
| Random Forest | **10.6528** | **22.1081** | **0.9231** |
| HistGradientBoosting | 10.6911 | 22.3158 | 0.9216 |

Therefore:

> **Random Forest was selected as the final model because it achieved the strongest validation performance among the machine learning models.**

---

## 11. Baseline Comparison

A persistence baseline was also evaluated.

The baseline predicts:

```text
Next-hour PM2.5 = Current-hour PM2.5
```

The persistence baseline achieved a mean validation RMSE of approximately:

```text
18.97 µg/m³
```

This was better than the initial machine learning models.

Therefore, the Random Forest should be described as:

> **The best-performing machine learning model**, rather than claiming that it outperformed the persistence baseline.

---

## 12. Feature Engineering Experiments

Random Forest was evaluated using different feature groups.

| Feature Group | Mean Validation RMSE |
|---|---:|
| Basic features | 23.1117 |
| Basic + temporal | 23.5235 |
| Basic + temporal + lag | 22.4982 |
| Basic + temporal + lag + rolling | **22.1081** |

The experiments showed that:

- Temporal features alone did not improve performance.
- Historical PM2.5 lag features improved performance.
- Rolling statistics provided further improvement.

The final feature group therefore includes the rolling features.

---

## 13. Hyperparameter Optimization

Random Forest hyperparameters were investigated using parameter sampling.

Parameters included:

```text
n_estimators
max_depth
min_samples_leaf
```

The selected parameter configuration was:

```text
n_estimators = 250
max_depth = 20
min_samples_leaf = 2
```

The tuning experiment did not improve the previous feature-group result, but the selected configuration was retained for the final model based on the project's model-selection process.

---

## 14. Final Model

### Final Algorithm

**Random Forest Regression**

### Final Features

**33 features**

### Final Model File

```text
backend/model/final_pm25_pipeline.joblib
```

The saved pipeline contains the required preprocessing and final machine learning model.

---

## 15. Final Test Evaluation

The final model was evaluated on the untouched 2017 holdout period.

Results:

```text
MAE  = 14.74 µg/m³
RMSE = 34.13 µg/m³
R²   = 0.912
```

The final test set was not used for model, feature, or hyperparameter selection.

---

## 16. System Architecture

```text
                 USER
                   │
                   ▼
          ┌─────────────────┐
          │    FRONTEND     │
          │   React + Vite  │
          └────────┬────────┘
                   │
                   │ HTTP
                   ▼
          ┌─────────────────┐
          │    FASTAPI      │
          │     BACKEND     │
          └────────┬────────┘
                   │
                   ▼
          ┌─────────────────┐
          │   Live Data     │
          │     APIs        │
          │   Open-Meteo    │
          └────────┬────────┘
                   │
                   ▼
          ┌─────────────────┐
          │ Feature Builder │
          │ 33 Model Inputs │
          └────────┬────────┘
                   │
                   ▼
          ┌─────────────────┐
          │ Saved Pipeline  │
          │ Random Forest   │
          └────────┬────────┘
                   │
                   ▼
          ┌─────────────────┐
          │ Next-Hour PM2.5 │
          │    Prediction   │
          └────────┬────────┘
                   │
                   ▼
          ┌─────────────────┐
          │ Frontend Result │
          └─────────────────┘
```

---

## 17. Backend

The backend is implemented using:

- Python
- FastAPI
- scikit-learn
- joblib
- Pandas
- NumPy
- Requests

### Main API Endpoints

#### Health / Root

```text
GET /
```

#### Available Stations

```text
GET /stations
```

#### Generate Prediction

```text
POST /predict
```

Example request:

```json
{
  "station": "Aotizhongxin"
}
```

Example response:

```json
{
  "station": "Aotizhongxin",
  "current_time": "2026-10-05 13:00:00",
  "predicted_time": "2026-10-05 14:00:00",
  "predicted_pm25": 14.42,
  "unit": "µg/m³"
}
```

---

## 18. Frontend

The frontend is implemented using:

- React
- TypeScript
- Vite

The interface provides:

- Monitoring station selection
- Live backend data
- Pollutant information
- Meteorological information
- PM2.5 historical features
- Rolling statistics
- Next-hour prediction
- Air-quality outlook
- Prediction status
- Responsive dashboard interface

The frontend communicates directly with the FastAPI backend.

No client-side prediction formula is used.

---

## 19. Live Data Integration

For current prediction, the backend retrieves current/recent environmental information through Open-Meteo APIs.

Air-quality information includes:

- PM2.5
- PM10
- CO
- NO2
- SO2
- O3

Weather information includes:

- Temperature
- Surface pressure
- Dew point
- Rain
- Wind speed
- Wind direction

The backend transforms these values into the same 33-feature schema required by the saved model pipeline.

---

## 20. Important Deployment Consideration

The machine learning model was trained and evaluated using the historical Beijing Multi-Site Air Quality dataset covering:

```text
2013–2017
```

The current application retrieves live environmental data through Open-Meteo.

Therefore, the reported model metrics:

```text
Validation R² = 0.9231
Final Test R² = 0.9120
```

represent performance on the project's historical evaluation data.

They should **not** be interpreted as measured accuracy on current 2026 live data.

This represents an important deployment limitation and potential area for future model updating/retraining.

---

## 21. System Testing

The integrated system was tested through:

### Backend Testing

- API startup
- Station retrieval
- Valid prediction requests
- Invalid station handling
- Model loading
- Prediction generation

### Frontend Testing

- Station selection
- Forecast generation
- Loading state
- Error handling
- Backend response display
- Reset functionality

### End-to-End Testing

```text
Select Station
      ↓
Frontend
      ↓
FastAPI
      ↓
Live Data
      ↓
Feature Engineering
      ↓
Saved ML Pipeline
      ↓
Prediction
      ↓
Frontend Display
```

---

## 22. Project Structure

```text
AirIQ/
│
├── README.md
│
├── backend/
│   ├── config/
│   │   ├── __init__.py
│   │   └── station_coordinates.py
│   │
│   ├── model/
│   │   └── final_pm25_pipeline.joblib
│   │
│   ├── services/
│   │   ├── __init__.py
│   │   ├── live_features.py
│   │   └── predictor.py
│   │
│   └── main.py
│
├── frontend/
│   ├── public/
│   ├── src/
│   ├── package.json
│   ├── package-lock.json
│   └── vite.config.ts
│
├── src/
│   ├── __init__.py
│   ├── modeling_utils.py
│   └── project_config.py
│
└── ...
```

---

## 23. Running the Application Locally

### Backend

From the project root:

```bash
py -m uvicorn backend.main:app --reload
```

Backend:

```text
http://127.0.0.1:8000
```

Swagger API documentation:

```text
http://127.0.0.1:8000/docs
```

### Frontend

Open a second terminal:

```bash
cd frontend
npm run dev
```

Frontend:

```text
http://localhost:5173
```

---

## 24. Practical Value

AirIQ provides a simple interface for obtaining short-term PM2.5 forecasts at selected Beijing monitoring stations.

Potential users include:

- Air-quality monitoring teams
- Environmental analysts
- Urban planners
- Researchers
- General users interested in short-term air-quality conditions

The system demonstrates how Data Mining and Machine Learning techniques can be integrated into an end-to-end prediction application.

---

## 25. Limitations

1. The model was trained using historical 2013–2017 data.
2. Current deployment data comes from Open-Meteo rather than the original UCI monitoring dataset.
3. The live data source and historical training source may have distribution differences.
4. The reported evaluation metrics are based on the historical test period and do not represent measured 2026 live-data performance.
5. Station coordinates used for live API requests represent deployment mappings to the monitoring stations.
6. The model predicts one hour ahead rather than long-term forecasts.

---

## 26. Future Improvements

Potential future improvements include:

- Retraining with newer air-quality observations
- Continuous model monitoring
- Automated model retraining
- Additional forecasting horizons
- More advanced time-series models
- Historical prediction visualizations
- User-defined monitoring preferences
- Public cloud deployment
- Model drift detection

---

## 27. Conclusion

AirIQ demonstrates a complete Data Mining workflow from real-world problem definition and dataset analysis through preprocessing, feature engineering, model comparison, optimization, final model selection, backend development, frontend development, and system testing.

The final system integrates a Random Forest regression pipeline with live environmental data to provide next-hour PM2.5 predictions through a user-friendly web interface.

---

## 28. Academic Context

**Module:** IT3051 – Fundamentals of Data Mining

**Project:** Mini Project 2026

**Machine Learning Task:** Regression

**Prediction Target:** Next-hour PM2.5 concentration

**Final Model:** Random Forest Regression

**System:** AirIQ – Next-Hour PM2.5 Air Quality Forecasting System