#pragma once

#include <jsi/jsi.h>
#include "BeatWaveCore.h"
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

    static jsi::Object convertResultToJsiObject(jsi::Runtime& runtime, const TrackAnalysisResult& res);
};

} // namespace jsi_bindings
} // namespace beatwave
