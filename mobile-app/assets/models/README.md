# Model Assets Directory

Place your trained mobile model files here.

### Expected Files:
1. **`laptop_detector_float16.tflite`** (Recommended):
   - Exported from the Kaggle training notebook (`laptop_high_acc.tflite` or `best_float16.tflite`).
   - Resolution: 640x640 (RGB Float32 normalized [0, 1]).
   - Hardware accelerated on mobile GPU / NNAPI / Hexagon DSP.
2. **`labels.txt`**:
   ```text
   laptop
   ```
3. **`model_config.json`**:
   - Model input dimensions and threshold parameters.

### How to get the trained model:
1. Run the training notebook `spatial-temporal-hyperspectral-tracking-framework.ipynb` on Kaggle with GPU enabled.
2. Download `laptop_detector_mobile_models.zip` from `/kaggle/working/`.
3. Extract and copy the `.tflite` file into this folder and name it `laptop_detector_float16.tflite`.
