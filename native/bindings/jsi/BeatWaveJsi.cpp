#include "BeatWaveJsi.h"
#include <thread>

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

    jsi::Object moduleObj(runtime);
    moduleObj.setProperty(runtime, "analyzeTrack", analyzeTrackHostFunc);
    moduleObj.setProperty(runtime, "getSpectralOverview", getSpectralOverviewHostFunc);

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

jsi::Value BeatWaveJsiModule::analyzeTrack(
    jsi::Runtime& runtime,
    const jsi::Value& thisValue,
    const jsi::Value* arguments,
    size_t count
) {
    if (count < 1 || !arguments[0].isString()) {
        throw jsi::JSError(runtime, "BeatWaveCore.analyzeTrack requiere argumento filePath de tipo string");
    }

    std::string filePath = arguments[0].asString(runtime).utf8(runtime);

    // En JSI puro para React Native, creamos una Promise de JS
    // y delegamos la computación a un std::thread desacoplado
    auto promiseConstructor = runtime.global().getPropertyAsFunction(runtime, "Promise");
    
    // Captura segura y ejecución en hilo de fondo
    auto callback = [filePath](jsi::Runtime& rt, const jsi::Value&, const jsi::Value* args, size_t) -> jsi::Value {
        auto resolve = std::make_shared<jsi::Function>(args[0].asObject(rt).asFunction(rt));
        auto reject = std::make_shared<jsi::Function>(args[1].asObject(rt).asFunction(rt));

        std::thread workerThread([&rt, filePath, resolve, reject]() {
            TrackAnalysisResult res = BeatWaveCore::getInstance().analyzeTrackSync(filePath);
            
            // Notificar al runtime (en TurboModules se despacha a través de CallInvoker)
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
    const jsi::Value& thisValue,
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

    // Zero-Copy MutableBufferView / ArrayBuffer en JSI
    auto arrayBufferCtor = runtime.global().getPropertyAsFunction(runtime, "ArrayBuffer");
    jsi::ArrayBuffer ab = runtime.global().getPropertyAsObject(runtime, "ArrayBuffer")
        .asFunction(runtime).callAsConstructor(runtime, static_cast<double>(size)).asObject(runtime).getArrayBuffer(runtime);

    std::memcpy(ab.data(runtime), ptr, size);
    return ab;
}

} // namespace jsi_bindings
} // namespace beatwave
