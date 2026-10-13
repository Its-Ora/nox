// Empêche la console de s'ouvrir sous Windows en release.
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    nox_lib::run()
}
