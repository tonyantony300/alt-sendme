class ShareSession {
  const ShareSession({required this.handle, required this.ticket});

  final int handle;
  final String ticket;
}

class ReceiveResult {
  const ReceiveResult({required this.message, required this.filePath});

  final String message;
  final String filePath;
}

class SendmeException implements Exception {
  const SendmeException(this.message);
  final String message;
  @override
  String toString() => 'SendmeException: $message';
}

class SendmeEvent {
  const SendmeEvent({required this.name, this.payload});
  final String name;
  final String? payload;
}

class ProgressPayload {
  const ProgressPayload({
    required this.bytes,
    required this.total,
    required this.speedBps,
  });

  final int bytes;
  final int total;
  final double speedBps;
}

ProgressPayload? parseProgressPayload(String payload) {
  final parts = payload.split(':');
  if (parts.length != 3) return null;
  final bytes = int.tryParse(parts[0]);
  final total = int.tryParse(parts[1]);
  final speedInt = int.tryParse(parts[2]);
  if (bytes == null || total == null || speedInt == null) return null;
  return ProgressPayload(bytes: bytes, total: total, speedBps: speedInt / 1000);
}

String formatBytes(num bytes) {
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  var value = bytes.toDouble();
  var unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit++;
  }
  final fixed = unit == 0 ? 0 : 1;
  return '${value.toStringAsFixed(fixed)} ${units[unit]}';
}

String formatSpeed(double bps) => '${formatBytes(bps)}/s';
