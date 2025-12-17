import 'dart:async';
import 'dart:convert';

import 'package:http/http.dart' as http;

import 'client.dart';
import 'types.dart';

class WebSendmeClient implements SendmeClient {
  WebSendmeClient({http.Client? httpClient})
    : _http = httpClient ?? http.Client();

  final http.Client _http;
  final _controller = StreamController<SendmeEvent>.broadcast();

  @override
  bool get available => true;

  @override
  String? get lastError => null;

  @override
  Stream<SendmeEvent> get events => _controller.stream;

  @override
  Future<void> init() async {
    // No-op on web.
  }

  Uri _url(String path) => Uri.base.replace(path: path);

  @override
  Future<ShareSession> startShareFromBytes({
    required String filename,
    required List<int> bytes,
  }) async {
    final request = http.MultipartRequest('POST', _url('/api/send'));
    request.files.add(
      http.MultipartFile.fromBytes('file', bytes, filename: filename),
    );
    final response = await http.Response.fromStream(await _http.send(request));
    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw SendmeException(
        'send failed: ${response.statusCode} ${response.body}',
      );
    }
    final json = jsonDecode(response.body) as Map<String, dynamic>;
    return ShareSession(
      handle: (json['shareId'] as num).toInt(),
      ticket: (json['ticket'] as String?) ?? '',
    );
  }

  @override
  Future<String> startReceiveJob(String ticket) async {
    final response = await _http.post(
      _url('/api/receive'),
      headers: {'content-type': 'application/json'},
      body: jsonEncode({'ticket': ticket}),
    );
    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw SendmeException(
        'receive start failed: ${response.statusCode} ${response.body}',
      );
    }
    final json = jsonDecode(response.body) as Map<String, dynamic>;
    final jobId = json['jobId'] as String?;
    if (jobId == null || jobId.isEmpty) {
      throw const SendmeException('receive start failed: missing jobId');
    }
    return jobId;
  }

  @override
  Future<ReceiveJobStatus> getReceiveJobStatus(String jobId) async {
    final response = await _http.get(_url('/api/receive/$jobId/status'));
    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw SendmeException(
        'receive status failed: ${response.statusCode} ${response.body}',
      );
    }
    final json = jsonDecode(response.body) as Map<String, dynamic>;
    return ReceiveJobStatus(
      state: (json['state'] as String?) ?? 'unknown',
      bytes: (json['bytes'] as num?)?.toInt(),
      total: (json['total'] as num?)?.toInt(),
      speedBps: (json['speedBps'] as num?)?.toDouble(),
      message: json['message'] as String?,
    );
  }

  @override
  Uri getReceiveDownloadUrl(String jobId) =>
      _url('/api/receive/$jobId/download');

  @override
  Future<ShareSession> startShareFromPath(String path) async {
    throw UnsupportedError('startShareFromPath is native-only');
  }

  @override
  Future<void> stopShare(int handle) async {
    // Web: best-effort stop endpoint (optional).
    await _http.post(_url('/api/send/$handle/stop'));
  }

  @override
  Future<ReceiveResult> receiveToDir({
    required String ticket,
    required String outputDir,
  }) async {
    throw UnsupportedError('receiveToDir is native-only');
  }
}

SendmeClient createSendmeClientImpl() => WebSendmeClient();
