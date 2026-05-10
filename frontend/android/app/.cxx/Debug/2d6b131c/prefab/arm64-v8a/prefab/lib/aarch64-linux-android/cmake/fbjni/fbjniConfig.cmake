if(NOT TARGET fbjni::fbjni)
add_library(fbjni::fbjni SHARED IMPORTED)
set_target_properties(fbjni::fbjni PROPERTIES
    IMPORTED_LOCATION "/home/gma91/.gradle/caches/8.10.2/transforms/678bdb38e171b3fe689ca3dfff58783a/transformed/fbjni-0.7.0/prefab/modules/fbjni/libs/android.arm64-v8a/libfbjni.so"
    INTERFACE_INCLUDE_DIRECTORIES "/home/gma91/.gradle/caches/8.10.2/transforms/678bdb38e171b3fe689ca3dfff58783a/transformed/fbjni-0.7.0/prefab/modules/fbjni/include"
    INTERFACE_LINK_LIBRARIES ""
)
endif()

