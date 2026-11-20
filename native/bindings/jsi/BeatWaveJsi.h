#pragma once

#include <jsi/jsi.h>
#include "BeatWaveCore.h"
#include "BeatWaveDSP.h"
#include <memory>

namespace beatwave {
namespace jsi_bindings {

using namespace facebook;

class BeatWaveJsiModule {
public:
    static void install(jsi::Runtime& runtime);

private:
    static jsi::Value analyzeTrack(
        jsi::Runtime& runtime,
        const jsi::Value& thisValue,
        const jsi::Value* arguments,
        size_t count
    );

    static jsi::Value getSpectralOverview(
        jsi::Runtime& runtime,
        const jsi::Value& thisValue,
        const jsi::Value* arguments,
        size_t count
    );

    // API Radar Zero-Copy: processAudioBuffer(Float32Array audio, string profile)
    static jsi::Value processAudioBuffer(
        jsi::Runtime& runtime,
        const jsi::Value& thisValue,
        const jsi::Value* arguments,
        size_t count
    );

    // API Fase 2: getEscalationBufferFLAC([audio, sampleRate]) -> Uint8Array (FLAC binary en RAM)
    static jsi::Value getEscalationBufferFLAC(
        jsi::Runtime& runtime,
        const jsi::Value& thisValue,
        const jsi::Value* arguments,
        size_t count
    );

    static jsi::Object convertResultToJsiObject(jsi::Runtime& runtime, const TrackAnalysisResult& res);
    static jsi::Object convertRadarResultToJsiObject(jsi::Runtime& runtime, const radar::FingerprintResult& res, const std::string& profile);

    static radar::BeatWaveDSP s_radarDsp;
};

} // namespace jsi_bindings
} // namespace beatwave
