import 'package:web/web.dart' as web;

void openUrlImpl(String url) {
  web.window.open(url, '_blank');
}
