import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:path_provider/path_provider.dart';

import '../sendme/instance.dart';
import '../sendme/client.dart';
import '../sendme/types.dart';
import '../util/open_url.dart';

class ReceiveTab extends StatefulWidget {
  const ReceiveTab({super.key});

  @override
  State<ReceiveTab> createState() => _ReceiveTabState();
}

class _ReceiveTabState extends State<ReceiveTab> {
  final _ticketController = TextEditingController();
  StreamSubscription<SendmeEvent>? _eventSub;

  bool _busy = false;
  String? _error;
  ReceiveResult? _result;
  String? _outputDir;
  int? _progressBytes;
  int? _progressTotal;
  double? _speedBps;
  String? _jobId;
  ReceiveJobStatus? _jobStatus;
  Timer? _pollTimer;

  @override
  void initState() {
    super.initState();
    if (!kIsWeb) {
      _initOutputDir();
    }
    _eventSub = sendme.events.listen(_onEvent);
  }

  @override
  void dispose() {
    _eventSub?.cancel();
    _pollTimer?.cancel();
    _ticketController.dispose();
    super.dispose();
  }

  Future<void> _initOutputDir() async {
    final dir = await getApplicationDocumentsDirectory();
    if (!mounted) return;
    setState(() {
      _outputDir = dir.path;
    });
  }

  @override
  Widget build(BuildContext context) {
    if (!sendme.available) {
      return _Unsupported(
        message: 'Sendme backend not available.\n\n${sendme.lastError ?? ""}',
      );
    }

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        Card(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Text('Ticket', style: Theme.of(context).textTheme.titleMedium),
                const SizedBox(height: 12),
                TextField(
                  controller: _ticketController,
                  maxLines: 3,
                  decoration: const InputDecoration(
                    border: OutlineInputBorder(),
                    hintText: 'Paste the ticket here',
                  ),
                ),
                const SizedBox(height: 12),
                Text(
                  kIsWeb
                      ? 'Web mode: the server will download and you will download from the server.'
                      : 'Output directory:\n${_outputDir ?? "Loading..."}',
                  style: Theme.of(context).textTheme.bodySmall,
                ),
                const SizedBox(height: 12),
                FilledButton(
                  onPressed: (_busy || (!kIsWeb && _outputDir == null))
                      ? null
                      : _receive,
                  child: _busy
                      ? const SizedBox(
                          height: 18,
                          width: 18,
                          child: CircularProgressIndicator(strokeWidth: 2),
                        )
                      : const Text('Receive'),
                ),
              ],
            ),
          ),
        ),
        if (_busy && _progressTotal != null) ...[
          const SizedBox(height: 16),
          _ProgressCard(
            bytes: _progressBytes ?? 0,
            total: _progressTotal!,
            speedBps: _speedBps,
          ),
        ],
        if (kIsWeb && _jobId != null) ...[
          const SizedBox(height: 16),
          _WebJobCard(
            status: _jobStatus,
            downloadUrl: _jobId == null
                ? null
                : sendme.getReceiveDownloadUrl(_jobId!),
            onDownload: _jobStatus?.state == 'done' && _jobId != null
                ? () =>
                      openUrl(sendme.getReceiveDownloadUrl(_jobId!).toString())
                : null,
          ),
        ],
        if (_result != null) ...[
          const SizedBox(height: 16),
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Result',
                    style: Theme.of(context).textTheme.titleMedium,
                  ),
                  const SizedBox(height: 8),
                  Text(_result!.message),
                  const SizedBox(height: 8),
                  SelectableText(_result!.filePath),
                ],
              ),
            ),
          ),
        ],
        if (_error != null) ...[
          const SizedBox(height: 16),
          _ErrorCard(message: _error!),
        ],
      ],
    );
  }

  Future<void> _receive() async {
    final ticket = _ticketController.text.trim();
    final outputDir = _outputDir;
    if (ticket.isEmpty) return;
    if (!kIsWeb && outputDir == null) return;

    setState(() {
      _busy = true;
      _error = null;
      _result = null;
      _jobId = null;
      _jobStatus = null;
      _progressBytes = null;
      _progressTotal = null;
      _speedBps = null;
    });

    try {
      if (kIsWeb) {
        final jobId = await sendme.startReceiveJob(ticket);
        if (!mounted) return;
        setState(() => _jobId = jobId);
        _startPolling(jobId);
      } else {
        final result = await sendme.receiveToDir(
          ticket: ticket,
          outputDir: outputDir!,
        );
        if (!mounted) return;
        setState(() => _result = result);
      }
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _error = e.toString();
      });
    } finally {
      if (mounted && !kIsWeb) {
        setState(() {
          _busy = false;
        });
      }
    }
  }

  void _startPolling(String jobId) {
    _pollTimer?.cancel();
    _pollTimer = Timer.periodic(const Duration(seconds: 1), (_) async {
      try {
        final status = await sendme.getReceiveJobStatus(jobId);
        if (!mounted) return;
        setState(() {
          _jobStatus = status;
          _progressBytes = status.bytes;
          _progressTotal = status.total;
          _speedBps = status.speedBps;
        });
        if (status.state == 'done' || status.state == 'error') {
          _pollTimer?.cancel();
          setState(() {
            _busy = false;
          });
        }
      } catch (e) {
        if (!mounted) return;
        setState(() {
          _error = e.toString();
          _busy = false;
        });
        _pollTimer?.cancel();
      }
    });
  }

  void _onEvent(SendmeEvent event) {
    if (!mounted) return;

    switch (event.name) {
      case 'receive-started':
        setState(() {
          _progressBytes = 0;
          _progressTotal = null;
          _speedBps = null;
        });
        break;
      case 'receive-progress':
        final payload = event.payload;
        if (payload == null) return;
        final parsed = parseProgressPayload(payload);
        if (parsed == null) return;
        setState(() {
          _progressBytes = parsed.bytes;
          _progressTotal = parsed.total;
          _speedBps = parsed.speedBps;
        });
        break;
      case 'receive-completed':
        setState(() {
          if (_progressTotal != null) {
            _progressBytes = _progressTotal;
          }
        });
        break;
      default:
        break;
    }
  }
}

class _ProgressCard extends StatelessWidget {
  const _ProgressCard({
    required this.bytes,
    required this.total,
    this.speedBps,
  });

  final int bytes;
  final int total;
  final double? speedBps;

  @override
  Widget build(BuildContext context) {
    final fraction = total <= 0 ? null : bytes / total;
    final percentText = total <= 0
        ? ''
        : ' • ${(fraction! * 100).clamp(0, 100).toStringAsFixed(1)}%';
    final speedText = speedBps == null ? '' : ' • ${formatSpeed(speedBps!)}';

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text('Receiving', style: Theme.of(context).textTheme.titleMedium),
            const SizedBox(height: 12),
            LinearProgressIndicator(value: fraction?.clamp(0.0, 1.0)),
            const SizedBox(height: 8),
            Text(
              '${formatBytes(bytes)} / ${formatBytes(total)}$percentText$speedText',
              style: Theme.of(context).textTheme.bodySmall,
            ),
          ],
        ),
      ),
    );
  }
}

class _WebJobCard extends StatelessWidget {
  const _WebJobCard({
    required this.status,
    required this.downloadUrl,
    required this.onDownload,
  });

  final ReceiveJobStatus? status;
  final Uri? downloadUrl;
  final VoidCallback? onDownload;

  @override
  Widget build(BuildContext context) {
    final state = status?.state ?? 'queued';
    final msg = status?.message;

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text(
              'Server job: $state',
              style: Theme.of(context).textTheme.titleMedium,
            ),
            if (msg != null && msg.isNotEmpty) ...[
              const SizedBox(height: 8),
              Text(msg, style: Theme.of(context).textTheme.bodySmall),
            ],
            if (downloadUrl != null) ...[
              const SizedBox(height: 12),
              SelectableText(downloadUrl.toString()),
            ],
            const SizedBox(height: 12),
            FilledButton(onPressed: onDownload, child: const Text('Download')),
          ],
        ),
      ),
    );
  }
}

class _ErrorCard extends StatelessWidget {
  const _ErrorCard({required this.message});
  final String message;

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    return Card(
      color: scheme.errorContainer,
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Text(message, style: TextStyle(color: scheme.onErrorContainer)),
      ),
    );
  }
}

class _Unsupported extends StatelessWidget {
  const _Unsupported({required this.message});
  final String message;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Text(message, textAlign: TextAlign.center),
      ),
    );
  }
}
