#include "BeatWaveNapi.h"

namespace beatwave {
namespace napi_bindings {

// Worker asíncrono para ejecutar el análisis fuera del hilo principal de Node/Electron
class AnalyzeTrackAsyncWorker : public Napi::AsyncWorker {
public:
    AnalyzeTrackAsyncWorker(Napi::Env env, const std::string& filePath, Napi::Promise::Deferred deferred)
        : Napi::AsyncWorker(env), m_filePath(filePath), m_deferred(deferred) {}

    void Execute() override {
        // Ejecución en Worker Thread de libuv
        m_result = BeatWaveCore::getInstance().analyzeTrackSync(m_filePath);
    }

    void OnOK() override {
        Napi::Env env = Env();
        Napi::HandleScope scope(env);
        if (m_result.success) {
            m_deferred.Resolve(ConvertResultToNapiObject(env, m_result));
        } else {
            m_deferred.Reject(Napi::Error::New(env, m_result.error_message).Value());
        }
    }

    void OnError(const Napi::Error& e) override {
        m_deferred.Reject(e.Value());
    }

private:
    std::string m_filePath;
    Napi::Promise::Deferred m_deferred;
    TrackAnalysisResult m_result;
};

Napi::Object ConvertResultToNapiObject(Napi::Env env, const TrackAnalysisResult& res) {
    Napi::Object obj = Napi::Object::New(env);
    obj.Set("success", Napi::Boolean::New(env, res.success));
    obj.Set("filePath", Napi::String::New(env, res.file_path));
    obj.Set("durationMs", Napi::Number::New(env, res.duration_ms));

    // 1. Rhythm Sub-Object
    Napi::Object rhythm = Napi::Object::New(env);
    rhythm.Set("bpm", Napi::Number::New(env, res.rhythm.bpm));
    rhythm.Set("firstDownbeatMs", Napi::Number::New(env, res.rhythm.first_downbeat_ms));
    rhythm.Set("gridOffsetMs", Napi::Number::New(env, res.rhythm.grid_offset_ms));
    rhythm.Set("timeSignatureNum", Napi::Number::New(env, res.rhythm.time_signature_num));
    rhythm.Set("timeSignatureDen", Napi::Number::New(env, res.rhythm.time_signature_den));
    rhythm.Set("confidence", Napi::Number::New(env, res.rhythm.confidence));
    
    Napi::Array beatsArr = Napi::Array::New(env, res.rhythm.beat_positions_ms.size());
    for (size_t i = 0; i < res.rhythm.beat_positions_ms.size(); ++i) {
        beatsArr.Set(i, Napi::Number::New(env, res.rhythm.beat_positions_ms[i]));
    }
    rhythm.Set("beatPositionsMs", beatsArr);
    obj.Set("rhythm", rhythm);

    // 2. Hotcues Sub-Object
    Napi::Object hotcues = Napi::Object::New(env);
    Napi::Array cuesArr = Napi::Array::New(env, res.hotcues.cues.size());
    for (size_t i = 0; i < res.hotcues.cues.size(); ++i) {
        const auto& c = res.hotcues.cues[i];
        Napi::Object cueObj = Napi::Object::New(env);
        cueObj.Set("id", Napi::Number::New(env, c.id));
        cueObj.Set("name", Napi::String::New(env, c.name));
        cueObj.Set("posMs", Napi::Number::New(env, c.pos_ms));
        cueObj.Set("colorHex", Napi::String::New(env, c.color_hex));
        cueObj.Set("type", Napi::String::New(env, c.type));
        cuesArr.Set(i, cueObj);
    }
    hotcues.Set("cues", cuesArr);
    obj.Set("hotcues", hotcues);

    // 3. Harmony Sub-Object
    Napi::Object harmony = Napi::Object::New(env);
    harmony.Set("standardKey", Napi::String::New(env, res.harmony.standard_key));
    harmony.Set("camelotKey", Napi::String::New(env, res.harmony.camelot_key));
    harmony.Set("openKey", Napi::String::New(env, res.harmony.open_key));
    harmony.Set("rootFreqHz", Napi::Number::New(env, res.harmony.root_freq_hz));
    harmony.Set("scaleConfidence", Napi::Number::New(env, res.harmony.scale_confidence));
    
    Napi::Array chromaArr = Napi::Array::New(env, res.harmony.chroma_vector.size());
    for (size_t i = 0; i < res.harmony.chroma_vector.size(); ++i) {
        chromaArr.Set(i, Napi::Number::New(env, res.harmony.chroma_vector[i]));
    }
    harmony.Set("chromaVector", chromaArr);
    obj.Set("harmony", harmony);

    // 4. Descriptors Sub-Object
    Napi::Object descriptors = Napi::Object::New(env);
    descriptors.Set("energy", Napi::Number::New(env, res.descriptors.energy));
    descriptors.Set("danceability", Napi::Number::New(env, res.descriptors.danceability));
    descriptors.Set("intensity", Napi::Number::New(env, res.descriptors.intensity));
    descriptors.Set("valence", Napi::Number::New(env, res.descriptors.valence));
    descriptors.Set("arousal", Napi::Number::New(env, res.descriptors.arousal));
    descriptors.Set("subBassDensity", Napi::Number::New(env, res.descriptors.sub_bass_density));
    descriptors.Set("midDensity", Napi::Number::New(env, res.descriptors.mid_density));
    descriptors.Set("highDensity", Napi::Number::New(env, res.descriptors.high_density));
    descriptors.Set("integratedLufs", Napi::Number::New(env, res.descriptors.integrated_lufs));
    descriptors.Set("dynamicRangeDb", Napi::Number::New(env, res.descriptors.dynamic_range_db));
    descriptors.Set("canonicalGenre", Napi::String::New(env, res.descriptors.canonical_genre));
    descriptors.Set("tacticalComment", Napi::String::New(env, res.descriptors.tactical_comment));
    obj.Set("descriptors", descriptors);

    return obj;
}

BeatWaveNapiModule::BeatWaveNapiModule(Napi::Env env, Napi::Exports exports) {
    DefineAddon(exports, {
        InstanceMethod("analyzeTrack", &BeatWaveNapiModule::AnalyzeTrack, napi_enumerable),
        InstanceMethod("getSpectralOverview", &BeatWaveNapiModule::GetSpectralOverview, napi_enumerable)
    });
}

Napi::Value BeatWaveNapiModule::AnalyzeTrack(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    if (info.Length() < 1 || !info[0].IsString()) {
        Napi::TypeError::New(env, "Argumento 'filePath' requerido de tipo string").ThrowAsJavaScriptException();
        return env.Null();
    }

    std::string filePath = info[0].As<Napi::String>().Utf8Value();
    Napi::Promise::Deferred deferred = Napi::Promise::Deferred::New(env);

    AnalyzeTrackAsyncWorker* worker = new AnalyzeTrackAsyncWorker(env, filePath, deferred);
    worker->Queue();

    return deferred.Promise();
}

Napi::Value BeatWaveNapiModule::GetSpectralOverview(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    if (info.Length() < 1 || !info[0].IsString()) {
        Napi::TypeError::New(env, "Argumento 'filePath' requerido").ThrowAsJavaScriptException();
        return env.Null();
    }

    std::string filePath = info[0].As<Napi::String>().Utf8Value();
    size_t size = 0;
    const uint8_t* ptr = BeatWaveCore::getInstance().getSpectralOverviewBuffer(filePath, size);

    if (!ptr || size == 0) {
        return env.Null();
    }

    // Zero-Copy ArrayBuffer wrapping C++ memory directly
    return Napi::ArrayBuffer::New(env, const_cast<uint8_t*>(ptr), size);
}

NODE_API_ADDON(BeatWaveNapiModule)

} // namespace napi_bindings
} // namespace beatwave
