#pragma once

#include <napi.h>
#include "BeatWaveCore.h"
#include "BeatWaveDSP.h"

namespace beatwave {
namespace napi_bindings {

class BeatWaveNapiModule : public Napi::Addon<BeatWaveNapiModule> {
public:
    BeatWaveNapiModule(Napi::Env env, Napi::Object exports);

private:
    // API expuesta: analyzeTrack(filePath) -> Promise<TrackAnalysisResult>
    Napi::Value AnalyzeTrack(const Napi::CallbackInfo& info);
    
    // API expuesta: getSpectralOverview(filePath) -> ArrayBuffer Zero-Copy
    Napi::Value GetSpectralOverview(const Napi::CallbackInfo& info);

    // API Radar Zero-Copy: processAudioBuffer(Float32Array audio, string profile) -> RadarResult
    Napi::Value ProcessAudioBuffer(const Napi::CallbackInfo& info);
};

// Conversores C++ Struct -> Napi::Object
Napi::Object ConvertResultToNapiObject(Napi::Env env, const TrackAnalysisResult& res);
Napi::Object ConvertRadarResultToNapiObject(Napi::Env env, const radar::FingerprintResult& res, const std::string& profile);

} // namespace napi_bindings
} // namespace beatwave
