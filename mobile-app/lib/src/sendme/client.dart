import 'types.dart';

import 'client_impl.dart'
    if (dart.library.html) 'client_web.dart'
    if (dart.library.io) 'client_native.dart';

abstract class SendmeClient {
  bool get available;
  String? get lastError;
  Stream<SendmeEvent> get events;

  Future<void> init();

  /// Native share from a local filesystem path (Android).
  Future<ShareSession> startShareFromPath(String path);
  Future<void> stopShare(int handle);

  /// Native receive into a local directory (Android).
  Future<ReceiveResult> receiveToDir({
    required String ticket,
    required String outputDir,
  });

  /// Web-only: upload bytes to server to create a share.
  Future<ShareSession> startShareFromBytes({
    required String filename,
    required List<int> bytes,
  });

  /// Web-only: start a server-side receive job.
  Future<String> startReceiveJob(String ticket);
  Future<ReceiveJobStatus> getReceiveJobStatus(String jobId);
  Uri getReceiveDownloadUrl(String jobId);
}

class ReceiveJobStatus {
  const ReceiveJobStatus({
    required this.state,
    this.bytes,
    this.total,
    this.speedBps,
    this.message,
  });

  final String state; // queued|running|done|error
  final int? bytes;
  final int? total;
  final double? speedBps;
  final String? message;
}

SendmeClient createSendmeClient() => createSendmeClientImpl();
