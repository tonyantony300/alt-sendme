import 'dart:async';
import 'dart:ffi';
import 'dart:isolate';

import '../native/sendme_ffi.dart';
import 'client.dart';
import 'types.dart';

class NativeSendmeClient implements SendmeClient {
  NativeSendmeClient() : _bindings = SendmeBindings.tryLoad();

  final SendmeBindings? _bindings;
  final _controller = StreamController<SendmeEvent>.broadcast();

  ReceivePort? _port;
  StreamSubscription<dynamic>? _sub;

  @override
  bool get available => _bindings != null;

  @override
  String? get lastError => SendmeBindings.lastLoadError;

  @override
  Stream<SendmeEvent> get events => _controller.stream;

  @override
  Future<void> init() async {
    final bindings = _bindings;
    if (bindings == null) return;

    // Ensure Dart API is initialized for this process.
    bindings.initDartApi();

    final port = ReceivePort();
    _port = port;
    _sub = port.listen(_onMessage);
    bindings.setEventPort(port.sendPort.nativePort);
  }

  void _onMessage(dynamic message) {
    if (message is List && message.length == 2) {
      final name = message[0];
      final payload = message[1];
      if (name is String && payload is String) {
        _controller.add(
          SendmeEvent(name: name, payload: payload.isEmpty ? null : payload),
        );
        return;
      }
    }
    if (message is String) {
      _controller.add(SendmeEvent(name: message));
    }
  }

  @override
  Future<ShareSession> startShareFromPath(String path) async {
    if (_bindings == null) {
      throw const SendmeException('native bindings missing');
    }
    final res = await Isolate.run(() => _startShareInIsolate({'path': path}));
    return ShareSession(
      handle: (res['handle'] as int?) ?? 0,
      ticket: (res['ticket'] as String?) ?? '',
    );
  }

  @override
  Future<void> stopShare(int handle) async {
    if (_bindings == null) {
      throw const SendmeException('native bindings missing');
    }
    await Isolate.run(() => _stopShareInIsolate({'handle': handle}));
  }

  @override
  Future<ReceiveResult> receiveToDir({
    required String ticket,
    required String outputDir,
  }) async {
    if (_bindings == null) {
      throw const SendmeException('native bindings missing');
    }
    final res = await Isolate.run(
      () => _receiveInIsolate({'ticket': ticket, 'outputDir': outputDir}),
    );
    return ReceiveResult(
      message: res['message'] ?? '',
      filePath: res['filePath'] ?? '',
    );
  }

  @override
  Future<ShareSession> startShareFromBytes({
    required String filename,
    required List<int> bytes,
  }) async {
    throw UnsupportedError('startShareFromBytes is web-only');
  }

  @override
  Future<String> startReceiveJob(String ticket) async {
    throw UnsupportedError('startReceiveJob is web-only');
  }

  @override
  Future<ReceiveJobStatus> getReceiveJobStatus(String jobId) async {
    throw UnsupportedError('getReceiveJobStatus is web-only');
  }

  @override
  Uri getReceiveDownloadUrl(String jobId) {
    throw UnsupportedError('getReceiveDownloadUrl is web-only');
  }

  Future<void> dispose() async {
    await _sub?.cancel();
    _port?.close();
    await _controller.close();
  }
}

SendmeClient createSendmeClientImpl() => NativeSendmeClient();

Map<String, Object?> _startShareInIsolate(Map<String, String> params) {
  final bindings = SendmeBindings.tryLoad();
  if (bindings == null) {
    throw SendmeException(
      SendmeBindings.lastLoadError ?? 'failed to load libsendme.so',
    );
  }
  final session = bindings.startShare(params['path'] ?? '');
  return {'handle': session.handle, 'ticket': session.ticket};
}

Object? _stopShareInIsolate(Map<String, Object?> params) {
  final bindings = SendmeBindings.tryLoad();
  if (bindings == null) {
    throw SendmeException(
      SendmeBindings.lastLoadError ?? 'failed to load libsendme.so',
    );
  }
  final handle = (params['handle'] as int?) ?? 0;
  bindings.stopShare(handle);
  return null;
}

Map<String, String> _receiveInIsolate(Map<String, String> params) {
  final bindings = SendmeBindings.tryLoad();
  if (bindings == null) {
    throw SendmeException(
      SendmeBindings.lastLoadError ?? 'failed to load libsendme.so',
    );
  }
  final result = bindings.receiveFile(
    ticket: params['ticket'] ?? '',
    outputDir: params['outputDir'] ?? '',
  );
  return {'message': result.message, 'filePath': result.filePath};
}
