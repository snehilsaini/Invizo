import axios from 'axios';

// const API_BASE_URL = 'http://localhost:3000/api'; // Change if your backend runs elsewhere
const API_BASE_URL = 'https://invisible-assisstant-backend.onrender.com/api';

// export const extractProblem = async (screenshots: string[], language: string) => {
//   try {
//     const response = await axios.post(`${API_BASE_URL}/extract`, { screenshots, language });
//     return response.data;
//   } catch (error: any) {
//     return {
//       success: false,
//       error: error?.response?.data?.error || error.message || "Unknown error"
//     };
//   }
// };

// export const solveProblem = async (problemInfo: any, language: string) => {
//   try {
//     const response = await axios.post(`${API_BASE_URL}/solve`, { ...problemInfo, language });
//     return response.data;
//   } catch (error: any) {
//     return {
//       success: false,
//       error: error?.response?.data?.error || error.message || "Unknown error"
//     };
//   }
// };


export const solveProblem = async (screenshots: string[], language: string) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/solve`, { screenshots, language });
    return response.data;
  } catch (error: any) {
    return {
      success: false,
      error: error?.response?.data?.error || error.message || "Unknown error"
    };
  }
};

export const debugProblem = async (screenshots: string[], language: string, code: string) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/debug`, { screenshots, language, code });
    return response.data;
  } catch (error: any) {
    return {
      success: false,
      error: error?.response?.data?.error || error.message || "Unknown error"
    };
  }
};