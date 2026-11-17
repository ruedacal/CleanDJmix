cmake_minimum_required(VERSION 3.16)
project(BeatWaveCore LANGUAGES CXX C)

# ==============================================================================
# CONFIGURACIÓN Y ESTÁNDARES C++
# ==============================================================================
set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_POSITION_INDEPENDENT_CODE ON)

# ==============================================================================
# OPCIONES DE COMPILACIÓN CRUZADA MULTIPLATAFORMA
# ==============================================================================
option(BUILD_RADAR_SHARED   "Compilar librería dinámica BeatWave Radar (.so/.dylib/.dll/.framework)" ON)
option(BUILD_NODE_ADDON     "Compilar N-API Addon para Desktop (Node/Electron/Tauri)" ON)
option(BUILD_JSI_MODULE     "Compilar TurboModule JSI para React Native (iOS/Android)" OFF)
option(BUILD_TESTS          "Compilar suite de tests unitarios nativos" ON)

# ==============================================================================
# FLAGS DE OPTIMIZACIÓN Y VECTORIZACIÓN SIMD
# ==============================================================================
if(MSVC)
    add_compile_options(/O2 /arch:AVX2 /W4 /MD)
    add_definitions(-D_CRT_SECURE_NO_WARNINGS -DWIN32_LEAN_AND_MEAN)
else()
    add_compile_options(-O3 -Wall -Wextra -pthread)
    # Habilitar vectorización nativa solo si no estamos en cross-compilation móvil
    if(NOT ANDROID AND NOT IOS)
        add_compile_options(-march=native)
    endif()
endif()

# Inclusión de cabeceras públicas del Core y Radar
include_directories(
    ${CMAKE_CURRENT_SOURCE_DIR}/include
)

# ==============================================================================
# RESOLUCIÓN DE DEPENDENCIAS EXTERNAS (miniaudio, FFTW, ACRCloud, LMDB)
# ==============================================================================
find_package(PkgConfig QUIET)

# 1. FFTW3 (opcional con fallback matemático integrado)
set(HAVE_FFTW3 0)
if(PkgConfig_FOUND)
    pkg_check_modules(FFTW3 QUIET fftw3)
    if(FFTW3_FOUND)
        set(HAVE_FFTW3 1)
        message(STATUS "[BeatWave] FFTW3 detectado: ${FFTW3_LIBRARIES}")
    endif()
endif()

# 2. ACRCloud SDK (acrcloud_extr_tool)
# Búsqueda de librerías estáticas en third_party o rutas del sistema
find_library(ACRCLOUD_LIB
    NAMES acrcloud_extr_tool libacrcloud_extr_tool
    PATHS 
        ${CMAKE_CURRENT_SOURCE_DIR}/third_party/acrcloud/lib
        ${CMAKE_CURRENT_SOURCE_DIR}/libs
        /usr/local/lib
        /opt/homebrew/lib
)
if(ACRCLOUD_LIB)
    message(STATUS "[BeatWave] ACRCloud SDK estático encontrado: ${ACRCLOUD_LIB}")
    add_definitions(-DHAVE_ACRCLOUD_SDK=1)
else()
    message(STATUS "[BeatWave] ACRCloud SDK no detectado; utilizando implementador ABI Zero-Copy en memoria")
endif()

# 3. LMDB (Lightning Memory-Mapped Database para Olaf)
find_package(LMDB QUIET)
if(NOT LMDB_FOUND AND PkgConfig_FOUND)
    pkg_check_modules(LMDB QUIET lmdb)
endif()

# ==============================================================================
# 1. LIBRERÍA CORE ESTÁTICA (BeatWaveCore & Radar DSP)
# ==============================================================================
set(CORE_SOURCES
    src/BeatWaveCore.cpp
    src/AudioDecoderResampler.cpp
    src/MelSpectrogram.cpp
    src/BeatThisRhythmEngine.cpp
    src/CleanRoomDynamics.cpp
    src/CleanRoomTonality.cpp
    src/BeatWaveDSP.cpp
)

add_library(beatwave_core STATIC ${CORE_SOURCES})
target_include_directories(beatwave_core PUBLIC ${CMAKE_CURRENT_SOURCE_DIR}/include)

if(HAVE_FFTW3)
    target_include_directories(beatwave_core PRIVATE ${FFTW3_INCLUDE_DIRS})
    target_link_libraries(beatwave_core PRIVATE ${FFTW3_LIBRARIES})
    target_compile_definitions(beatwave_core PRIVATE HAVE_FFTW3=1)
endif()

if(ACRCLOUD_LIB)
    target_link_libraries(beatwave_core PRIVATE ${ACRCLOUD_LIB})
endif()

# ==============================================================================
# 2. TARGET LIBRERÍA DINÁMICA MULTIPLATAFORMA (BeatWave Radar)
# Genera: .so (Android/Linux), .dylib (macOS), .dll (Windows), .framework (iOS)
# ==============================================================================
if(BUILD_RADAR_SHARED)
    add_library(beatwave_radar SHARED
        src/BeatWaveDSP.cpp
    )
    target_include_directories(beatwave_radar PUBLIC ${CMAKE_CURRENT_SOURCE_DIR}/include)
    target_link_libraries(beatwave_radar PRIVATE beatwave_core)

    # Configuración de nombres y extensiones nativas por sistema operativo
    if(ANDROID)
        # Android JNI / NDK (.so)
        set_target_properties(beatwave_radar PROPERTIES
            OUTPUT_NAME "beatwave_radar"
            PREFIX "lib"
            SUFFIX ".so"
        )
        target_link_libraries(beatwave_radar PRIVATE log)
    elseif(IOS)
        # iOS Framework (.framework / XCFramework)
        set_target_properties(beatwave_radar PROPERTIES
            FRAMEWORK TRUE
            MACOSX_FRAMEWORK_IDENTIFIER "com.beatwave.radar"
            MACOSX_FRAMEWORK_INFO_PLIST "${CMAKE_CURRENT_SOURCE_DIR}/cmake/Info.plist.in"
            OUTPUT_NAME "BeatWaveRadar"
            PUBLIC_HEADER "${CMAKE_CURRENT_SOURCE_DIR}/include/BeatWaveDSP.h"
        )
    elseif(APPLE)
        # macOS Dynamic Library (.dylib)
        set_target_properties(beatwave_radar PROPERTIES
            OUTPUT_NAME "beatwave_radar"
            PREFIX "lib"
            SUFFIX ".dylib"
            MACOSX_RPATH TRUE
        )
    elseif(WIN32)
        # Windows Dynamic Link Library (.dll)
        set_target_properties(beatwave_radar PROPERTIES
            OUTPUT_NAME "beatwave_radar"
            PREFIX ""
            SUFFIX ".dll"
        )
        target_compile_definitions(beatwave_radar PRIVATE BEATWAVE_EXPORTS)
    else()
        # Linux / Unix (.so)
        set_target_properties(beatwave_radar PROPERTIES
            OUTPUT_NAME "beatwave_radar"
            PREFIX "lib"
            SUFFIX ".so"
        )
    endif()
endif()

# ==============================================================================
# 3. TARGET DESKTOP N-API (node-addon-api para Electron/Tauri)
# ==============================================================================
if(BUILD_NODE_ADDON)
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

    set_target_properties(beatwave_napi PROPERTIES
        PREFIX ""
        SUFFIX ".node"
        OUTPUT_NAME "beatwave_core"
    )
endif()

# ==============================================================================
# 4. TARGET MOBILE JSI (React Native TurboModules para iOS/Android)
# ==============================================================================
if(BUILD_JSI_MODULE)
    add_library(beatwave_jsi STATIC
        bindings/jsi/BeatWaveJsi.cpp
    )
    target_link_libraries(beatwave_jsi PUBLIC beatwave_core)
endif()

# ==============================================================================
# 5. SUITE DE TESTS UNITARIOS NATIVOS
# ==============================================================================
if(BUILD_TESTS)
    add_executable(test_clean_room
        tests/test_clean_room.cpp
        src/CleanRoomDynamics.cpp
        src/CleanRoomTonality.cpp
    )
    target_include_directories(test_clean_room PRIVATE ${CMAKE_CURRENT_SOURCE_DIR}/include)

    add_executable(test_radar_dsp
        tests/test_radar_dsp.cpp
        src/BeatWaveDSP.cpp
    )
    target_include_directories(test_radar_dsp PRIVATE ${CMAKE_CURRENT_SOURCE_DIR}/include)
endif()
