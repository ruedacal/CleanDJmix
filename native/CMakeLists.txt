cmake_minimum_required(VERSION 3.16)
project(BeatWaveCore LANGUAGES CXX C)

# Estándar C++ moderno y opciones de optimización
set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_POSITION_INDEPENDENT_CODE ON)

# Opciones de compilación cruzada por target
option(BUILD_NODE_ADDON "Compilar N-API Addon para Desktop (Node/Electron/Tauri)" ON)
option(BUILD_JSI_MODULE "Compilar TurboModule JSI para React Native (iOS/Android)" OFF)

# Flags de optimización y vectorización SIMD
if(MSVC)
    add_compile_options(/O2 /arch:AVX2 /W4)
else()
    add_compile_options(-O3 -march=native -Wall -Wextra -pthread)
endif()

# Inclusión de cabeceras públicas del Core
include_directories(
    ${CMAKE_CURRENT_SOURCE_DIR}/include
)

# 1. Librería Core Compartida (BeatWaveCore)
set(CORE_SOURCES
    src/BeatWaveCore.cpp
    src/AudioDecoderResampler.cpp
    src/MelSpectrogram.cpp
    src/BeatThisRhythmEngine.cpp
    src/CleanRoomDynamics.cpp
    src/CleanRoomTonality.cpp
)

add_library(beatwave_core STATIC ${CORE_SOURCES})
target_include_directories(beatwave_core PUBLIC ${CMAKE_CURRENT_SOURCE_DIR}/include)

# Búsqueda condicional de FFTW3 y ONNX Runtime
find_package(PkgConfig QUIET)
if(PkgConfig_FOUND)
    pkg_check_modules(FFTW3 QUIET fftw3)
    if(FFTW3_FOUND)
        target_include_directories(beatwave_core PRIVATE ${FFTW3_INCLUDE_DIRS})
        target_link_libraries(beatwave_core PRIVATE ${FFTW3_LIBRARIES})
        target_compile_definitions(beatwave_core PRIVATE HAVE_FFTW3=1)
    endif()
endif()

# 2. Target Desktop N-API (node-addon-api)
if(BUILD_NODE_ADDON)
    # Ubicación automática de node-addon-api vía npm/node
    execute_process(
        COMMAND node -p "require('node-addon-api').include"
        WORKING_DIRECTORY ${CMAKE_CURRENT_SOURCE_DIR}
        OUTPUT_VARIABLE NODE_ADDON_API_DIR
        OUTPUT_STRIP_TRAILING_WHITESPACE
        ERROR_QUIET
    )

    if(NODE_ADDON_API_DIR)
        string(REPLACE "\"" "" NODE_ADDON_API_DIR ${NODE_ADDON_API_DIR})
        include_directories(${NODE_ADDON_API_DIR})
    endif()

    add_library(beatwave_napi SHARED
        bindings/napi/BeatWaveNapi.cpp
    )

    target_link_libraries(beatwave_napi PRIVATE beatwave_core)
    target_compile_definitions(beatwave_napi PRIVATE NAPI_CPP_EXCEPTIONS)

    # Configuración de sufijo nativo .node para NodeJS
    set_target_properties(beatwave_napi PROPERTIES
        PREFIX ""
        SUFFIX ".node"
        OUTPUT_NAME "beatwave_core"
    )
endif()

# 3. Target Mobile JSI (React Native / iOS / Android)
if(BUILD_JSI_MODULE)
    # Cabeceras JSI provistas por React Native toolchain / Pods
    find_package(ReactAndroid QUIET)
    
    add_library(beatwave_jsi STATIC
        bindings/jsi/BeatWaveJsi.cpp
    )
    
    target_link_libraries(beatwave_jsi PUBLIC beatwave_core)
endif()
