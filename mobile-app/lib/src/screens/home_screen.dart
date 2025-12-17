import 'package:flutter/material.dart';

import 'receive_tab.dart';
import 'send_tab.dart';

class HomeScreen extends StatelessWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return DefaultTabController(
      length: 2,
      child: Scaffold(
        appBar: AppBar(
          title: const Text('AltSendme'),
          bottom: const TabBar(
            tabs: [
              Tab(text: 'Send'),
              Tab(text: 'Receive'),
            ],
          ),
        ),
        body: const TabBarView(children: [SendTab(), ReceiveTab()]),
      ),
    );
  }
}
