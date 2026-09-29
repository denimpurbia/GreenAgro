import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  AlertTriangle,
  CheckCircle2,
  Stethoscope,
  Sparkles,
  Loader2,
  ShieldAlert,
  Settings,
  RefreshCw,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { DiseaseDiagnosisResult } from '../types';
import { authService } from '../services/authService';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';
const DISCLAIMER =
  'AI-generated agricultural guidance. For critical crop-treatment decisions, consult a qualified local agricultural extension officer.';

/** Convert File to base64 string (without data: prefix) */
async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Strip "data:image/...;base64," prefix
      resolve(result.split(',')[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export const CropDoctorPage: React.FC = () => {
  const { t, disease, setDisease, farm, language } = useApp();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [diagnosisError, setDiagnosisError] = useState<string | null>(null);
  const [apiNotConfigured, setApiNotConfigured] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset state
    setDisease(null);
    setDiagnosisError(null);
    setApiNotConfigured(false);

    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    await runAnalysis(file);

    // Reset input so the same file can be re-selected
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const runAnalysis = async (file: File) => {
    setIsAnalyzing(true);
    setDiagnosisError(null);
    setApiNotConfigured(false);

    try {
      const imageBase64 = await fileToBase64(file);

      const token = authService.getToken();
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${API_BASE}/disease/diagnose`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          imageBase64,
          mimeType: file.type || 'image/jpeg',
          cropName: farm?.primaryCrop || 'crop',
          language,
          farmId: farm?.id,
        }),
      });

      const contentType = response.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        setDiagnosisError('Unable to reach the crop diagnosis service. Please ensure the backend server is running.');
        return;
      }

      const text = await response.text();
      let data: any = null;
      try {
        data = text && text.trim() ? JSON.parse(text) : null;
      } catch {
        data = null;
      }

      if (!data) {
        setDiagnosisError('Received invalid response from diagnosis service. Please try again.');
        return;
      }

      if (data.status === 'api_not_configured') {
        setApiNotConfigured(true);
        return;
      }

      if (data.status === 'error' || !response.ok) {
        setDiagnosisError(data.message || 'Crop diagnosis failed. Please try again.');
        return;
      }

      // Success — set real Gemini result
      // identifiedCrop is the AI's independent visual assessment; NEVER use farm?.primaryCrop here.
      const result: DiseaseDiagnosisResult = {
        identifiedCrop: data.identifiedCrop,
        cropIdentificationStatus: data.cropIdentificationStatus,
        diseaseName: data.diseaseName || 'Unknown',
        confidence: data.confidence || 'Low Confidence',
        confidenceScore: Number(data.confidenceScore ?? 0),
        severity: data.severity || 'none',
        observedSymptoms: Array.isArray(data.observedSymptoms) ? data.observedSymptoms : [],
        recommendedActions: Array.isArray(data.recommendedActions) ? data.recommendedActions : [],
        disclaimer: data.disclaimer || DISCLAIMER,
        analyzedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        imageUrl: previewUrl || undefined,
      };
      setDisease(result);
    } catch {
      setDiagnosisError(
        'Unable to reach the diagnosis service. Please ensure the backend server is running.'
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  const severityColor = (severity?: string) => {
    switch (severity) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-amber-100 text-amber-900 border-amber-200';
      default: return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0f291e]">
          {t('disease.title')}
        </h1>
        <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
          {t('disease.subtitle')}
        </p>
      </div>

      {/* Main Card */}
      <div className="bg-white rounded-3xl p-5 sm:p-7 border border-[#e8ece8] shadow-card">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">

          {/* Column 1: Upload Dropzone */}
          <div
            className="lg:col-span-4 flex flex-col items-center justify-center p-6 border-2 border-dashed border-agri-300/80 rounded-2xl bg-[#f8faf7] text-center hover:bg-[#edf7ee] transition-colors cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
            <div className="w-12 h-12 rounded-2xl bg-white border border-gray-200 flex items-center justify-center text-agri-700 shadow-2xs mb-3">
              <UploadCloud className="w-6 h-6 stroke-[2]" />
            </div>
            <h3 className="font-bold text-sm text-gray-900">
              {t('disease.uploadTitle')}
            </h3>
            <p className="text-xs text-gray-500 mt-1">
              {t('disease.uploadHint')}
            </p>
            <p className="text-[10px] text-gray-400 mt-0.5">
              {t('disease.uploadFormats')}
            </p>
            <button
              type="button"
              className="mt-4 px-4 py-2 rounded-xl bg-white border border-gray-200 text-xs font-semibold text-gray-800 shadow-2xs hover:bg-gray-50 transition-colors"
            >
              {t('disease.chooseFile')}
            </button>
          </div>

          {/* Column 2: Image Preview */}
          <div className="lg:col-span-4 flex flex-col items-center justify-center">
            <div className="relative w-full h-64 sm:h-72 rounded-2xl overflow-hidden border border-gray-200 shadow-md bg-gray-100 flex items-center justify-center">
              {previewUrl ? (
                <img
                  src={previewUrl}
                  alt="Analyzed crop leaf"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex flex-col items-center gap-2 text-gray-400">
                  <Stethoscope className="w-10 h-10" />
                  <span className="text-xs font-medium">Upload a leaf image to analyze</span>
                </div>
              )}

              {isAnalyzing && (
                <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex flex-col items-center justify-center text-white gap-2 p-4 text-center">
                  <Loader2 className="w-8 h-8 animate-spin text-agri-400" />
                  <span className="text-xs font-semibold">
                    Analyzing with Google Gemini Vision...
                  </span>
                </div>
              )}

              {previewUrl && !isAnalyzing && (
                <div className="absolute bottom-2 left-2 right-2 bg-black/60 backdrop-blur-xs px-2.5 py-1 rounded-lg text-[10px] text-white flex items-center justify-between">
                  <span>
                    Subject:{' '}
                    {disease?.cropIdentificationStatus === 'identified' && disease.identifiedCrop
                      ? `${disease.identifiedCrop} Leaf`
                      : disease?.cropIdentificationStatus === 'uncertain'
                      ? 'Crop identification uncertain'
                      : disease?.cropIdentificationStatus === 'not_a_crop_leaf'
                      ? 'Image not suitable for crop diagnosis'
                      : disease?.cropIdentificationStatus === 'unknown'
                      ? 'Unknown Leaf'
                      : 'Crop identification pending'}
                  </span>
                  <span className="text-emerald-400 font-bold">Ready</span>
                </div>
              )}
            </div>

            {previewUrl && !isAnalyzing && (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="mt-3 inline-flex items-center gap-1.5 text-xs text-agri-700 font-semibold hover:text-agri-900"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Upload different image</span>
              </button>
            )}
          </div>

          {/* Column 3: Diagnosis Result */}
          <div className="lg:col-span-4 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <h2 className="text-base font-bold text-gray-900">
                {t('disease.resultTitle')}
              </h2>
              <span className="text-[10px] bg-agri-50 text-agri-800 font-semibold px-2 py-0.5 rounded-full border border-agri-200">
                Gemini Multimodal
              </span>
            </div>

            {/* Awaiting image */}
            {!previewUrl && !isAnalyzing && !disease && !diagnosisError && !apiNotConfigured && (
              <div className="flex flex-col items-center justify-center py-8 text-center text-gray-400">
                <Stethoscope className="w-8 h-8 mb-2 text-gray-300" />
                <p className="text-xs">Upload a leaf image to get an AI-powered disease diagnosis.</p>
              </div>
            )}

            {/* Analyzing spinner */}
            {isAnalyzing && (
              <div className="flex flex-col items-center justify-center py-8 gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-agri-600" />
                <p className="text-xs text-gray-500">Gemini is analyzing the image...</p>
              </div>
            )}

            {/* API not configured */}
            {apiNotConfigured && !isAnalyzing && (
              <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 flex flex-col items-center text-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-gray-500">
                  <Settings className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-800">Crop Diagnosis Not Configured</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Set <code className="bg-gray-100 px-1 rounded">GEMINI_API_KEY</code> in your server .env file to enable AI-powered disease detection.
                  </p>
                </div>
              </div>
            )}

            {/* Error state */}
            {diagnosisError && !isAnalyzing && (
              <div className="p-4 rounded-2xl bg-red-50 border border-red-200 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-red-800">Diagnosis Failed</p>
                  <p className="text-xs text-red-600 mt-0.5">{diagnosisError}</p>
                  <button
                    onClick={() => previewUrl && fileInputRef.current?.click()}
                    className="mt-2 text-xs text-red-700 font-semibold underline"
                  >
                    Try again
                  </button>
                </div>
              </div>
            )}

            {/* Real diagnosis result */}
            {disease && !isAnalyzing && (
              <>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="bg-amber-100 text-amber-900 text-xs font-extrabold px-3 py-1 rounded-lg border border-amber-200">
                    {disease.diseaseName}
                  </span>
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-lg border ${severityColor(disease.severity)}`}>
                    {disease.confidence}
                  </span>
                  {disease.confidenceScore > 0 && (
                    <span className="text-[11px] text-gray-500">{disease.confidenceScore}%</span>
                  )}
                </div>

                {disease.observedSymptoms.length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider">
                      {t('disease.symptomsTitle')}
                    </h3>
                    <ul className="space-y-1 text-xs text-gray-600">
                      {disease.observedSymptoms.map((s, i) => (
                        <li key={i} className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-agri-600 shrink-0" />
                          <span>{s}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {disease.recommendedActions.length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider">
                      {t('disease.actionsTitle')}
                    </h3>
                    <ul className="space-y-1 text-xs text-gray-700">
                      {disease.recommendedActions.map((a, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-agri-700 mt-0.5 shrink-0" />
                          <span>{a}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {disease.analyzedAt && (
                  <p className="text-[10px] text-gray-400">Analyzed at {disease.analyzedAt}</p>
                )}
              </>
            )}
          </div>
        </div>

        {/* Advisory Disclaimer */}
        <div className="mt-6 pt-4 border-t border-gray-100 flex items-start gap-2.5 text-xs text-gray-500 bg-[#f8faf7] p-3.5 rounded-2xl">
          <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            {disease?.disclaimer || DISCLAIMER}
          </p>
        </div>
      </div>
    </div>
  );
};
