import 'open_url_impl.dart'
    if (dart.library.html) 'open_url_web.dart'
    if (dart.library.io) 'open_url_io.dart';

void openUrl(String url) => openUrlImpl(url);
