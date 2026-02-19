/**
 * HTTP client for communicating with Python model service
 */

import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';

const PYTHON_SERVICE_URL = process.env.PYTHON_SERVICE_URL || 'http://localhost:8000';
const TIMEOUT_MS = 120000; // 2 minutes

export async function callPythonDetection(filePath) {
  try {
    const formData = new FormData();
    formData.append('file', fs.createReadStream(filePath));
    
    const response = await axios.post(
      `${PYTHON_SERVICE_URL}/detect`,
      formData,
      {
        headers: formData.getHeaders(),
        timeout: TIMEOUT_MS,
        maxContentLength: Infinity,
        maxBodyLength: Infinity
      }
    );
    
    return response.data;
  } catch (error) {
    if (error.response) {
      throw new Error(`Python service error: ${error.response.status} - ${JSON.stringify(error.response.data)}`);
    } else if (error.request) {
      throw new Error('Python service not responding');
    } else {
      throw new Error(`Request setup error: ${error.message}`);
    }
  }
}

export async function checkPythonHealth() {
  try {
    const response = await axios.get(`${PYTHON_SERVICE_URL}/health`, {
      timeout: 5000
    });
    return response.data;
  } catch (error) {
    return { status: 'unhealthy', error: error.message };
  }
}
