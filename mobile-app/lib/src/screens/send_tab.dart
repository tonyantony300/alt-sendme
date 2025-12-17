import 'dart:async';

import 'package:file_picker/file_picker.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../sendme/instance.dart';
import '../sendme/types.dart';

class SendTab extends StatefulWidget {
  const SendTab({super.key});

  @override
  State<SendTab> createState() => _SendTabState();
}

class _SendTabState extends State<SendTab> {
  StreamSubscription<SendmeEvent>? _eventSub;

  String? _selectedPath;
  Uint8List? _selectedBytes;
  String? _selectedName;
  ShareSession? _session;
  bool _busy = false;
  String? _error;
  bool _transferStarted = false;
  int? _progressBytes;
  int? _progressTotal;
  double? _speedBps;

  @override
  void initState() {
    super.initState();
    _eventSub = sendme.events.listen(_onEvent);
  }

  @override
  void dispose() {
    _eventSub?.cancel();
    super.dispose();
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
        _Section(
          title: 'Pick a file',
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              FilledButton.icon(
                onPressed: _busy ? null : _pickFile,
                icon: const Icon(Icons.attach_file),
                label: const Text('Choose file'),
              ),
              const SizedBox(height: 12),
              Text(
                _selectedName ?? _selectedPath ?? 'No file selected',
                style: Theme.of(context).textTheme.bodySmall,
              ),
            ],
          ),
        ),
        const SizedBox(height: 16),
        _Section(
          title: 'Share',
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              FilledButton(
                onPressed: (_busy || _selectedPath == null || _session != null)
                    ? null
                    : _startShare,
                child: _busy
                    ? const SizedBox(
                        height: 18,
                        width: 18,
                        child: CircularProgressIndicator(strokeWidth: 2),
                      )
                    : const Text('Start sharing'),
              ),
              const SizedBox(height: 8),
              OutlinedButton(
                onPressed: (_busy || _session == null) ? null : _stopShare,
                child: const Text('Stop sharing'),
              ),
              const SizedBox(height: 12),
              if (_session != null) ...[
                SelectableText(
                  _session!.ticket,
                  style: Theme.of(context).textTheme.bodyMedium,
                ),
                const SizedBox(height: 8),
                if (_transferStarted && _progressTotal != null) ...[
                  _ProgressCard(
                    bytes: _progressBytes ?? 0,
                    total: _progressTotal!,
                    speedBps: _speedBps,
                  ),
                  const SizedBox(height: 8),
                ] else ...[
                  Text(
                    'Waiting for receiver to connect...',
                    style: Theme.of(context).textTheme.bodySmall,
                  ),
                  const SizedBox(height: 8),
                ],
                Row(
                  children: [
                    Expanded(
                      child: OutlinedButton.icon(
                        onPressed: _busy ? null : _copyTicket,
                        icon: const Icon(Icons.copy),
                        label: const Text('Copy ticket'),
                      ),
                    ),
                  ],
                ),
              ] else
                Text(
                  'Start sharing to generate a ticket.',
                  style: Theme.of(context).textTheme.bodySmall,
                ),
            ],
          ),
        ),
        if (_error != null) ...[
          const SizedBox(height: 16),
          _ErrorCard(message: _error!),
        ],
      ],
    );
  }

  Future<void> _pickFile() async {
    setState(() {
      _error = null;
    });

    final result = await FilePicker.platform.pickFiles(
      allowMultiple: false,
      withData: kIsWeb,
    );
    final file = result?.files.single;
    if (file == null) return;
    final path = file.path;
    final bytes = file.bytes;

    setState(() {
      _selectedPath = path;
      _selectedBytes = bytes;
      _selectedName = file.name;
    });
  }

  Future<void> _startShare() async {
    final path = _selectedPath;
    final bytes = _selectedBytes;
    final name = _selectedName;

    if (kIsWeb) {
      if (bytes == null || name == null) {
        setState(() => _error = 'Please choose a file first.');
        return;
      }
    } else {
      if (path == null) {
        setState(() => _error = 'Please choose a file first.');
        return;
      }
    }

    setState(() {
      _busy = true;
      _error = null;
      _transferStarted = false;
      _progressBytes = null;
      _progressTotal = null;
      _speedBps = null;
    });

    try {
      final session = kIsWeb
          ? await sendme.startShareFromBytes(filename: name!, bytes: bytes!)
          : await sendme.startShareFromPath(path!);
      setState(() => _session = session);
    } catch (e) {
      setState(() {
        _error = e.toString();
      });
    } finally {
      setState(() {
        _busy = false;
      });
    }
  }

  Future<void> _stopShare() async {
    final session = _session;
    if (session == null) return;

    setState(() {
      _busy = true;
      _error = null;
    });

    try {
      await sendme.stopShare(session.handle);
      setState(() {
        _session = null;
        _transferStarted = false;
        _progressBytes = null;
        _progressTotal = null;
        _speedBps = null;
      });
    } catch (e) {
      setState(() {
        _error = e.toString();
      });
    } finally {
      setState(() {
        _busy = false;
      });
    }
  }

  Future<void> _copyTicket() async {
    final ticket = _session?.ticket;
    if (ticket == null) return;
    await Clipboard.setData(ClipboardData(text: ticket));
    if (!mounted) return;
    ScaffoldMessenger.of(
      context,
    ).showSnackBar(const SnackBar(content: Text('Ticket copied')));
  }

  void _onEvent(SendmeEvent event) {
    if (!mounted) return;
    if (_session == null) return;

    switch (event.name) {
      case 'transfer-started':
        setState(() {
          _transferStarted = true;
        });
        break;
      case 'transfer-progress':
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
      case 'transfer-completed':
        setState(() {
          _transferStarted = false;
          if (_progressTotal != null) _progressBytes = _progressTotal;
        });
        break;
      case 'transfer-failed':
        setState(() {
          _transferStarted = false;
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

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        LinearProgressIndicator(value: fraction?.clamp(0.0, 1.0)),
        const SizedBox(height: 8),
        Text(
          '${formatBytes(bytes)} / ${formatBytes(total)}$percentText$speedText',
          style: Theme.of(context).textTheme.bodySmall,
        ),
      ],
    );
  }
}

class _Section extends StatelessWidget {
  const _Section({required this.title, required this.child});

  final String title;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(title, style: Theme.of(context).textTheme.titleMedium),
            const SizedBox(height: 12),
            child,
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
