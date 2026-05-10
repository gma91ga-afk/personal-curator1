if(NOT TARGET hermes-engine::libhermes)
add_library(hermes-engine::libhermes SHARED IMPORTED)
set_target_properties(hermes-engine::libhermes PROPERTIES
    IMPORTED_LOCATION "/home/gma91/.gradle/caches/8.10.2/transforms/c1d3ec71c2e3d2ac13b7c0ee659bafa0/transformed/hermes-android-0.80.0-debug/prefab/modules/libhermes/libs/android.arm64-v8a/libhermes.so"
    INTERFACE_INCLUDE_DIRECTORIES "/home/gma91/.gradle/caches/8.10.2/transforms/c1d3ec71c2e3d2ac13b7c0ee659bafa0/transformed/hermes-android-0.80.0-debug/prefab/modules/libhermes/include"
    INTERFACE_LINK_LIBRARIES ""
)
endif()

