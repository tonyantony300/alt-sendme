import 'dart:ffi';
import 'dart:io';

import 'package:ffi/ffi.dart';

import '../sendme/types.dart';

class SendmeBindings {
  SendmeBindings._(this._lib) {
    _freeString = _lib.lookupFunction<_FreeStringNative, _FreeStringDart>(
      'sendme_ffi_free_string',
    );
    _initDartApi = _lib.lookupFunction<_InitDartApiNative, _InitDartApiDart>(
      'sendme_ffi_init_dart_api',
    );
    _setEventPort = _lib.lookupFunction<_SetEventPortNative, _SetEventPortDart>(
      'sendme_ffi_set_event_port',
    );
    _version = _lib.lookupFunction<_VersionNative, _VersionDart>(
      'sendme_ffi_version',
    );
    _startShare = _lib.lookupFunction<_StartShareNative, _StartShareDart>(
      'sendme_ffi_start_share',
    );
    _stopShare = _lib.lookupFunction<_StopShareNative, _StopShareDart>(
      'sendme_ffi_stop_share',
    );
    _receiveFile = _lib.lookupFunction<_ReceiveFileNative, _ReceiveFileDart>(
      'sendme_ffi_receive_file',
    );
  }

  static String? lastLoadError;

  final DynamicLibrary _lib;

  late final _FreeStringDart _freeString;
  late final _InitDartApiDart _initDartApi;
  late final _SetEventPortDart _setEventPort;
  late final _VersionDart _version;
  late final _StartShareDart _startShare;
  late final _StopShareDart _stopShare;
  late final _ReceiveFileDart _receiveFile;

  static SendmeBindings? tryLoad() {
    try {
      if (Platform.isAndroid) {
        final bindings = SendmeBindings._(DynamicLibrary.open('libsendme.so'));
        bindings.initDartApi();
        lastLoadError = null;
        return bindings;
      }
      return null;
    } catch (e) {
      lastLoadError = e.toString();
      return null;
    }
  }

  int initDartApi() {
    return _initDartApi(NativeApi.initializeApiDLData);
  }

  void setEventPort(int port) {
    _setEventPort(port);
  }

  String version() {
    final ptr = _version();
    return _consumeRustString(ptr);
  }

  ShareSession startShare(String path) {
    final outHandle = calloc<Uint64>();
    final outTicket = calloc<Pointer<Int8>>();
    final pathPtr = path.toNativeUtf8().cast<Int8>();

    try {
      final errPtr = _startShare(pathPtr, outHandle, outTicket);
      _throwIfError(errPtr);

      final handle = outHandle.value;
      final ticket = _consumeRustString(outTicket.value);
      return ShareSession(handle: handle, ticket: ticket);
    } finally {
      calloc.free(pathPtr);
      calloc.free(outHandle);
      calloc.free(outTicket);
    }
  }

  void stopShare(int handle) {
    final errPtr = _stopShare(handle);
    _throwIfError(errPtr);
  }

  ReceiveResult receiveFile({
    required String ticket,
    required String outputDir,
  }) {
    final ticketPtr = ticket.toNativeUtf8().cast<Int8>();
    final outputPtr = outputDir.toNativeUtf8().cast<Int8>();
    final outMessage = calloc<Pointer<Int8>>();
    final outFilePath = calloc<Pointer<Int8>>();

    try {
      final errPtr = _receiveFile(
        ticketPtr,
        outputPtr,
        outMessage,
        outFilePath,
      );
      _throwIfError(errPtr);

      final message = _consumeRustString(outMessage.value);
      final filePath = _consumeRustString(outFilePath.value);
      return ReceiveResult(message: message, filePath: filePath);
    } finally {
      calloc.free(ticketPtr);
      calloc.free(outputPtr);
      calloc.free(outMessage);
      calloc.free(outFilePath);
    }
  }

  void _throwIfError(Pointer<Int8> errPtr) {
    if (errPtr == nullptr) return;
    final msg = _consumeRustString(errPtr);
    throw SendmeException(msg);
  }

  String _consumeRustString(Pointer<Int8> ptr) {
    if (ptr == nullptr) return '';
    final s = ptr.cast<Utf8>().toDartString();
    _freeString(ptr);
    return s;
  }
}

typedef _FreeStringNative = Void Function(Pointer<Int8>);
typedef _FreeStringDart = void Function(Pointer<Int8>);

typedef _InitDartApiNative = IntPtr Function(Pointer<Void>);
typedef _InitDartApiDart = int Function(Pointer<Void>);

typedef _SetEventPortNative = Void Function(Uint64);
typedef _SetEventPortDart = void Function(int);

typedef _VersionNative = Pointer<Int8> Function();
typedef _VersionDart = Pointer<Int8> Function();

typedef _StartShareNative =
    Pointer<Int8> Function(
      Pointer<Int8>,
      Pointer<Uint64>,
      Pointer<Pointer<Int8>>,
    );
typedef _StartShareDart =
    Pointer<Int8> Function(
      Pointer<Int8>,
      Pointer<Uint64>,
      Pointer<Pointer<Int8>>,
    );

typedef _StopShareNative = Pointer<Int8> Function(Uint64);
typedef _StopShareDart = Pointer<Int8> Function(int);

typedef _ReceiveFileNative =
    Pointer<Int8> Function(
      Pointer<Int8>,
      Pointer<Int8>,
      Pointer<Pointer<Int8>>,
      Pointer<Pointer<Int8>>,
    );
typedef _ReceiveFileDart =
    Pointer<Int8> Function(
      Pointer<Int8>,
      Pointer<Int8>,
      Pointer<Pointer<Int8>>,
      Pointer<Pointer<Int8>>,
    );
