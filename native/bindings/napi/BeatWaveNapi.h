#pragma once

#include <napi.h>
#include "BeatWaveCore.h"

namespace beatwave {
namespace napi_bindings {

class BeatWaveNapiModule : public Napi::Addon<BeatWaveNapiModule> {
public:
    BeatWaveNapiModule(Napi::Env env, Napi::Exports exports);

private:
    // API expuesta: analyzeTrack(filePath) -> Promise<TrackAnalysisResult>
    Napi::Value AnalyzeTrack(const Napi::CallbackInfo& info);
    
    // API expuesta: getSpectralOverview(filePath) -> ArrayBuffer Zero-Copy
    Napi::Value GetSpectralOverview(const Napi::CallbackInfo& info);
};

// Conversor C++ Struct -> Napi::Object
Napi::Object ConvertResultToNapiObject(Napi::Env env, const TrackAnalysisResult& res);

} // namespace napi_bindings
} // namespace beatwave
