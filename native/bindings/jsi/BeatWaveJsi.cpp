#include "BeatWaveJsi.h"
#include <thread>
#include <cstring>
#include <algorithm>

namespace beatwave {
namespace jsi_bindings {

using namespace facebook;

void BeatWaveJsiModule::install(jsi::Runtime& runtime) {
    auto analyzeTrackHostFunc = jsi::Function::createFromHostFunction(
        runtime,
        jsi::PropNameID::forAscii(runtime, "analyzeTrack"),
        1,
        BeatWaveJsiModule::analyzeTrack
    );

    auto getSpectralOverviewHostFunc = jsi::Function::createFromHostFunction(
        runtime,
        jsi::PropNameID::forAscii(runtime, "getSpectralOverview"),
        1,
        BeatWaveJsiModule::getSpectralOverview
    );

    auto processAudioBufferHostFunc = jsi::Function::createFromHostFunction(
        runtime,
        jsi::PropNameID::forAscii(runtime, "processAudioBuffer"),
        2,
        BeatWaveJsiModule::processAudioBuffer
    );

    jsi::Object moduleObj(runtime);
    moduleObj.setProperty(runtime, "analyzeTrack", analyzeTrackHostFunc);
    moduleObj.setProperty(runtime, "getSpectralOverview", getSpectralOverviewHostFunc);
    moduleObj.setProperty(runtime, "processAudioBuffer", processAudioBufferHostFunc);

    // Instalar en el objeto global de React Native (global.BeatWaveCore)
    runtime.global().setProperty(runtime, "BeatWaveCore", moduleObj);
}

jsi::Object BeatWaveJsiModule::convertResultToJsiObject(jsi::Runtime& runtime, const TrackAnalysisResult& res) {
    jsi::Object obj(runtime);
    obj.setProperty(runtime, "success", res.success);
    obj.setProperty(runtime, "filePath", jsi::String::createFromUtf8(runtime, res.file_path));
    obj.setProperty(runtime, "durationMs", res.duration_ms);

    // 1. Rhythm
    jsi::Object rhythm(runtime);
    rhythm.setProperty(runtime, "bpm", res.rhythm.bpm);
    rhythm.setProperty(runtime, "firstDownbeatMs", res.rhythm.first_downbeat_ms);
    rhythm.setProperty(runtime, "gridOffsetMs", res.rhythm.grid_offset_ms);
    rhythm.setProperty(runtime, "timeSignatureNum", res.rhythm.time_signature_num);
    rhythm.setProperty(runtime, "timeSignatureDen", res.rhythm.time_signature_den);
    rhythm.setProperty(runtime, "confidence", res.rhythm.confidence);
    
    jsi::Array beatsArr(runtime, res.rhythm.beat_positions_ms.size());
    for (size_t i = 0; i < res.rhythm.beat_positions_ms.size(); ++i) {
        beatsArr.setValueAtIndex(runtime, i, res.rhythm.beat_positions_ms[i]);
    }
    rhythm.setProperty(runtime, "beatPositionsMs", beatsArr);
    obj.setProperty(runtime, "rhythm", rhythm);

    // 2. Hotcues
    jsi::Object hotcues(runtime);
    jsi::Array cuesArr(runtime, res.hotcues.cues.size());
    for (size_t i = 0; i < res.hotcues.cues.size(); ++i) {
        const auto& c = res.hotcues.cues[i];
        jsi::Object cueObj(runtime);
        cueObj.setProperty(runtime, "id", c.id);
        cueObj.setProperty(runtime, "name", jsi::String::createFromUtf8(runtime, c.name));
        cueObj.setProperty(runtime, "posMs", c.pos_ms);
        cueObj.setProperty(runtime, "colorHex", jsi::String::createFromUtf8(runtime, c.color_hex));
        cueObj.setProperty(runtime, "type", jsi::String::createFromUtf8(runtime, c.type));
        cuesArr.setValueAtIndex(runtime, i, cueObj);
    }
    hotcues.setProperty(runtime, "cues", cuesArr);
    obj.setProperty(runtime, "hotcues", hotcues);

    // 3. Harmony
    jsi::Object harmony(runtime);
    harmony.setProperty(runtime, "standardKey", jsi::String::createFromUtf8(runtime, res.harmony.standard_key));
    harmony.setProperty(runtime, "camelotKey", jsi::String::createFromUtf8(runtime, res.harmony.camelot_key));
    harmony.setProperty(runtime, "openKey", jsi::String::createFromUtf8(runtime, res.harmony.open_key));
    harmony.setProperty(runtime, "rootFreqHz", res.harmony.root_freq_hz);
    harmony.setProperty(runtime, "scaleConfidence", res.harmony.scale_confidence);

    jsi::Array chromaArr(runtime, res.harmony.chroma_vector.size());
    for (size_t i = 0; i < res.harmony.chroma_vector.size(); ++i) {
        chromaArr.setValueAtIndex(runtime, i, res.harmony.chroma_vector[i]);
    }
    harmony.setProperty(runtime, "chromaVector", chromaArr);
    obj.setProperty(runtime, "harmony", harmony);

    // 4. Descriptors
    jsi::Object descriptors(runtime);
    descriptors.setProperty(runtime, "energy", res.descriptors.energy);
    descriptors.setProperty(runtime, "danceability", res.descriptors.danceability);
    descriptors.setProperty(runtime, "intensity", res.descriptors.intensity);
    descriptors.setProperty(runtime, "valence", res.descriptors.valence);
    descriptors.setProperty(runtime, "arousal", res.descriptors.arousal);
    descriptors.setProperty(runtime, "subBassDensity", res.descriptors.sub_bass_density);
    descriptors.setProperty(runtime, "midDensity", res.descriptors.mid_density);
    descriptors.setProperty(runtime, "highDensity", res.descriptors.high_density);
    descriptors.setProperty(runtime, "integratedLufs", res.descriptors.integrated_lufs);
    descriptors.setProperty(runtime, "dynamicRangeDb", res.descriptors.dynamic_range_db);
    descriptors.setProperty(runtime, "canonicalGenre", jsi::String::createFromUtf8(runtime, res.descriptors.canonical_genre));
    descriptors.setProperty(runtime, "tacticalComment", jsi::String::createFromUtf8(runtime, res.descriptors.tactical_comment));
    obj.setProperty(runtime, "descriptors", descriptors);

    return obj;
}

jsi::Object BeatWaveJsiModule::convertRadarResultToJsiObject(
    jsi::Runtime& runtime,
    const radar::FingerprintResult& res,
    const std::string& profile
) {
    jsi::Object obj(runtime);

    // 1. Telemetría acústica
    jsi::Object telemetry(runtime);
    telemetry.setProperty(runtime, "rmsDbfs", static_cast<double>(res.rms_dbfs));
    telemetry.setProperty(runtime, "peakDbfs", static_cast<double>(res.peak_dbfs));
    telemetry.setProperty(runtime, "isClipping", res.peak_dbfs >= -1.05f);
    telemetry.setProperty(runtime, "durationMs", static_cast<double>(res.duration_ms));
    telemetry.setProperty(runtime, "sampleRate", static_cast<double>(res.sample_rate));
    telemetry.setProperty(runtime, "environment", jsi::String::createFromUtf8(runtime, profile));
    obj.setProperty(runtime, "telemetry", telemetry);

    // 2. Huella remota ACRCloud (Uint8Array)
    jsi::Function uint8ArrayCtor = runtime.global().getPropertyAsFunction(runtime, "Uint8Array");
    if (!res.acrcloud_fingerprint.empty()) {
        auto arrayBufferCtor = runtime.global().getPropertyAsFunction(runtime, "ArrayBuffer");
        jsi::ArrayBuffer ab = arrayBufferCtor.callAsConstructor(
            runtime, static_cast<double>(res.acrcloud_fingerprint.size())
        ).asObject(runtime).getArrayBuffer(runtime);
        
        std::memcpy(ab.data(runtime), res.acrcloud_fingerprint.data(), res.acrcloud_fingerprint.size());
        jsi::Object u8Obj = uint8ArrayCtor.callAsConstructor(runtime, ab).asObject(runtime);
        obj.setProperty(runtime, "acrcloudFingerprint", u8Obj);
    } else {
        obj.setProperty(runtime, "acrcloudFingerprint", jsi::Value::null());
    }

    // 3. Huella local Olaf LMDB (Uint8Array)
    if (!res.olaf_fingerprint.empty()) {
        auto arrayBufferCtor = runtime.global().getPropertyAsFunction(runtime, "ArrayBuffer");
        jsi::ArrayBuffer ab = arrayBufferCtor.callAsConstructor(
            runtime, static_cast<double>(res.olaf_fingerprint.size())
        ).asObject(runtime).getArrayBuffer(runtime);
        
        std::memcpy(ab.data(runtime), res.olaf_fingerprint.data(), res.olaf_fingerprint.size());
        jsi::Object u8Obj = uint8ArrayCtor.callAsConstructor(runtime, ab).asObject(runtime);
        obj.setProperty(runtime, "olafFingerprint", u8Obj);
    } else {
        obj.setProperty(runtime, "olafFingerprint", jsi::Value::null());
    }

    obj.setProperty(runtime, "landmarksCount", static_cast<double>(res.olaf_landmarks_count));
    obj.setProperty(runtime, "isValid", res.is_valid);

    return obj;
}

jsi::Value BeatWaveJsiModule::analyzeTrack(
    jsi::Runtime& runtime,
    const jsi::Value&,
    const jsi::Value* arguments,
    size_t count
) {
    if (count < 1 || !arguments[0].isString()) {
        throw jsi::JSError(runtime, "BeatWaveCore.analyzeTrack requiere argumento filePath");
    }

    std::string filePath = arguments[0].asString(runtime).utf8(runtime);
    auto promiseConstructor = runtime.global().getPropertyAsFunction(runtime, "Promise");

    auto callback = [filePath](jsi::Runtime& rt, const jsi::Value&, const jsi::Value* args, size_t) -> jsi::Value {
        auto resolve = std::make_shared<jsi::Function>(args[0].asObject(rt).asFunction(rt));
        auto reject = std::make_shared<jsi::Function>(args[1].asObject(rt).asFunction(rt));

        std::thread workerThread([&rt, filePath, resolve, reject]() {
            TrackAnalysisResult res = BeatWaveCore::getInstance().analyzeTrackSync(filePath);
            if (res.success) {
                jsi::Object resObj = BeatWaveJsiModule::convertResultToJsiObject(rt, res);
                resolve->call(rt, resObj);
            } else {
                reject->call(rt, jsi::String::createFromUtf8(rt, res.error_message));
            }
        });
        workerThread.detach();

        return jsi::Value::undefined();
    };

    auto executor = jsi::Function::createFromHostFunction(
        runtime,
        jsi::PropNameID::forAscii(runtime, "executor"),
        2,
        callback
    );

    return promiseConstructor.callAsConstructor(runtime, executor);
}

jsi::Value BeatWaveJsiModule::getSpectralOverview(
    jsi::Runtime& runtime,
    const jsi::Value&,
    const jsi::Value* arguments,
    size_t count
) {
    if (count < 1 || !arguments[0].isString()) {
        throw jsi::JSError(runtime, "BeatWaveCore.getSpectralOverview requiere filePath string");
    }

    std::string filePath = arguments[0].asString(runtime).utf8(runtime);
    size_t size = 0;
    const uint8_t* ptr = BeatWaveCore::getInstance().getSpectralOverviewBuffer(filePath, size);

    if (!ptr || size == 0) {
        return jsi::Value::null();
    }

    auto arrayBufferCtor = runtime.global().getPropertyAsFunction(runtime, "ArrayBuffer");
    jsi::ArrayBuffer ab = arrayBufferCtor.callAsConstructor(
        runtime, static_cast<double>(size)
    ).asObject(runtime).getArrayBuffer(runtime);

    std::memcpy(ab.data(runtime), ptr, size);
    return ab;
}

// ============================================================================
// ZERO-COPY RADAR JSI: processAudioBuffer(Float32Array audio, string profile)
// ============================================================================
jsi::Value BeatWaveJsiModule::processAudioBuffer(
    jsi::Runtime& runtime,
    const jsi::Value&,
    const jsi::Value* arguments,
    size_t count
) {
    if (count < 1 || !arguments[0].isObject()) {
        throw jsi::JSError(runtime, "BeatWaveCore.processAudioBuffer requiere un argumento Float32Array");
    }

    jsi::Object audioObj = arguments[0].asObject(runtime);
    jsi::ArrayBuffer arrayBuffer(runtime);
    size_t byteOffset = 0;
    size_t byteLength = 0;

    // Extracción Zero-Copy de Float32Array o ArrayBuffer
    if (audioObj.hasProperty(runtime, "buffer")) {
        arrayBuffer = audioObj.getProperty(runtime, "buffer").asObject(runtime).getArrayBuffer(runtime);
        byteOffset = static_cast<size_t>(audioObj.getProperty(runtime, "byteOffset").asNumber());
        byteLength = static_cast<size_t>(audioObj.getProperty(runtime, "byteLength").asNumber());
    } else if (audioObj.isArrayBuffer(runtime)) {
        arrayBuffer = audioObj.getArrayBuffer(runtime);
        byteOffset = 0;
        byteLength = arrayBuffer.size(runtime);
    } else {
        throw jsi::JSError(runtime, "El argumento de audio debe ser Float32Array o ArrayBuffer");
    }

    // Puntero directo a memoria de JavaScript SIN COPIAS (Zero-Copy)
    const float* floatData = reinterpret_cast<const float*>(arrayBuffer.data(runtime) + byteOffset);
    size_t numSamples = byteLength / sizeof(float);

    if (!floatData || numSamples == 0) {
        throw jsi::JSError(runtime, "El buffer Float32Array no contiene muestras");
    }

    // Perfil de ecualización acústica ("club" | "studio")
    std::string profile = "club";
    if (count > 1 && arguments[1].isString()) {
        profile = arguments[1].asString(runtime).utf8(runtime);
    }

    radar::RadarEnvironmentMode envMode = (profile == "studio") 
        ? radar::RadarEnvironmentMode::Studio 
        : radar::RadarEnvironmentMode::Club;

    uint32_t inSampleRate = 44100;
    if (count > 2 && arguments[2].isNumber()) {
        inSampleRate = static_cast<uint32_t>(arguments[2].asNumber());
    }

    // Procesar en el motor DSP Radar
    radar::BeatWaveDSP dspEngine(envMode);
    radar::FingerprintResult res = dspEngine.processSingleBuffer(
        floatData,
        numSamples,
        1, // Mono stream
        inSampleRate
    );

    return convertRadarResultToJsiObject(runtime, res, profile);
}

} // namespace jsi_bindings
} // namespace beatwave
