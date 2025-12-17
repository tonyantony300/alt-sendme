import 'package:flutter/material.dart';

import 'src/sendme/instance.dart';
import 'src/screens/home_screen.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await sendme.init();
  runApp(const AltSendmeApp());
}

class AltSendmeApp extends StatelessWidget {
  const AltSendmeApp({super.key});

  @override
  Widget build(BuildContext context) {
    final colorScheme = ColorScheme.fromSeed(
      seedColor: const Color(0xFF6366F1),
      brightness: Brightness.dark,
    );

    return MaterialApp(
      title: 'AltSendme',
      theme: ThemeData(useMaterial3: true, colorScheme: colorScheme),
      home: const HomeScreen(),
    );
  }
}
