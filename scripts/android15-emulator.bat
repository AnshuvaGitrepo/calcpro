@echo off
rem Start the Android 15 test phone for CalcPro.
rem netsim features are switched off because netsimd.exe crashes on CPUs without AVX2
rem (illegal instruction 0xc000001d) and the emulator then hangs at boot.
rem Add -no-window to run it without a window (screenshots via adb still work).
"%LOCALAPPDATA%\Android\Sdk\emulator\emulator.exe" -avd CalcPro_Pixel7_API35 -no-snapshot-save -no-boot-anim ^
  -feature -WiFiPacketStream,-ModemSimulator,-NetsimWebUi,-NetsimCliUi %*
