from PySide6.QtWidgets import (QApplication, QGraphicsView, QGraphicsScene, QGraphicsItem,
                                 QGraphicsEllipseItem, QGraphicsTextItem, QVBoxLayout, QWidget,
                                 QPushButton, QHBoxLayout, QDialog, QFormLayout, QLineEdit,
                                 QDialogButtonBox, QFileDialog, QGraphicsPathItem)
from PySide6.QtCore import Qt, QPointF, QTimer
from PySide6.QtGui import QPainter, QPen, QPainterPath, QColor, QKeyEvent, QCursor
import sys
import json
import os


class PortItem(QGraphicsEllipseItem):
    def __init__(self, parent_node, is_output):
        super().__init__(-5, -5, 10, 10, parent_node)
        self.setBrush(Qt.green if is_output else Qt.blue)
        self.setZValue(1)
        self.setFlag(QGraphicsItem.ItemIsMovable, False)
        self.setAcceptHoverEvents(True)
        self.setCursor(Qt.CrossCursor)
        self.is_output = is_output
        self.parent_node = parent_node

    def mousePressEvent(self, event):
        if event.button() == Qt.LeftButton and self.is_output:
            self.scene().editor.connection_start = self.parent_node
            self.scene().editor.connection_preview = ConnectionLine(self.parent_node, self.parent_node, preview=True)
            self.scene().addItem(self.scene().editor.connection_preview)

    def mouseReleaseEvent(self, event):
        editor = self.scene().editor
        if event.button() == Qt.LeftButton and not self.is_output and editor.connection_start:
            source = editor.connection_start
            target = self.parent_node
            if source != target:
                connection = ConnectionLine(source, target)
                self.scene().addItem(connection)
                editor.connections.append(connection)
            if editor.connection_preview:
                self.scene().removeItem(editor.connection_preview)
            editor.connection_preview = None
            editor.connection_start = None


class ZoomableGraphicsView(QGraphicsView):
    def __init__(self, scene):
        super().__init__(scene)
        self.setRenderHint(QPainter.Antialiasing)
        self.setTransformationAnchor(QGraphicsView.AnchorUnderMouse)
        self.setResizeAnchor(QGraphicsView.AnchorUnderMouse)
        self.setDragMode(QGraphicsView.ScrollHandDrag)
        self.setBackgroundBrush(QColor(240, 240, 240))

    def wheelEvent(self, event):
        zoom_factor = 1.15 if event.angleDelta().y() > 0 else 1 / 1.15
        self.scale(zoom_factor, zoom_factor)

    def keyPressEvent(self, event: QKeyEvent):
        if event.key() == Qt.Key_Delete:
            to_remove = self.scene().selectedItems()
            editor = self.scene().editor

            for item in to_remove:
                if hasattr(item, 'connections'):
                    for c, t in item.connections:
                        if hasattr(c, 'timer'):
                            c.timer.stop()
                        t.incoming_connections = [(cl, s) for cl, s in t.incoming_connections if cl != c]
                        self.scene().removeItem(c)
                        if c in editor.connections:
                            editor.connections.remove(c)

                    for c, s in item.incoming_connections:
                        if hasattr(c, 'timer'):
                            c.timer.stop()
                        s.connections = [(cl, t) for cl, t in s.connections if cl != c]
                        self.scene().removeItem(c)
                        if c in editor.connections:
                            editor.connections.remove(c)

                self.scene().removeItem(item)
                if item in editor.nodes:
                    editor.nodes.remove(item)
        else:
            super().keyPressEvent(event)


class ConnectionLine(QGraphicsPathItem):
    def __init__(self, start_item, end_item, preview=False):
        super().__init__()
        self.start_item = start_item
        self.end_item = end_item
        self.preview = preview
        self.setZValue(-1)
        self.setPen(QPen(Qt.darkGray if not preview else Qt.lightGray, 2, Qt.DashLine if preview else Qt.SolidLine))
        self.setFlags(QGraphicsItem.ItemIsSelectable)
        self.update_path()

        if not preview and start_item != end_item:
            self.start_item.connections.append((self, self.end_item))
            self.end_item.incoming_connections.append((self, self.start_item))

            # Automatisch Bedingung setzen im Ziel-Node
            flag_expr = f"Flags[\"{start_item.node_id.strip()}\"] === true"
            if self.end_item.bedingung:
                if flag_expr not in self.end_item.bedingung:
                    self.end_item.bedingung += f" && {flag_expr}"
            else:
                self.end_item.bedingung = flag_expr

        self.timer = QTimer()
        self.timer.timeout.connect(self.update_path)
        self.timer.start(50)

    def update_path(self):
        path = QPainterPath()
        try:
            start_pos = self.start_item.mapToScene(self.start_item.output_port.pos()) + QPointF(5, 5)
            end_pos = self.start_item.scene().views()[0].mapToScene(
                self.start_item.scene().views()[0].mapFromGlobal(QCursor.pos())
            ) if self.preview else self.end_item.mapToScene(self.end_item.input_port.pos()) + QPointF(5, 5)
        except RuntimeError:
            self.timer.stop()
            try:
                scene = self.scene()
                if scene:
                    scene.removeItem(self)
            except RuntimeError:
                pass
            return

        path.moveTo(start_pos)
        ctrl1 = QPointF(start_pos.x() + 100, start_pos.y())
        ctrl2 = QPointF(end_pos.x() - 100, end_pos.y())
        path.cubicTo(ctrl1, ctrl2, end_pos)
        self.setPath(path)


class NodeItem(QGraphicsEllipseItem):
    def __init__(self, x, y, label):
        super().__init__(-30, -30, 60, 60)
        self.setBrush(Qt.lightGray)
        self.setFlags(QGraphicsItem.ItemIsMovable | QGraphicsItem.ItemIsSelectable)
        self.setPos(x, y)

        self.node_id = label
        self.typ = "entscheidung"
        self.beschreibung = ""
        self.bedingung = ""
        self.mehrfach = False
        self.effekte = {}
        self.setFlags = {}
        self.requireFlags = {}

        self.connections = []
        self.incoming_connections = []

        self.text = QGraphicsTextItem(self)
        self.text.setDefaultTextColor(Qt.black)
        self.update_text()
        self.text.setPos(-28, -10)

        self.input_port = PortItem(self, is_output=False)
        self.input_port.setPos(-35, 0)

        self.output_port = PortItem(self, is_output=True)
        self.output_port.setPos(25, 0)

    def mouseDoubleClickEvent(self, event):
        self.dialog = NodeDialog(self)
        self.dialog.setWindowModality(Qt.NonModal)
        self.dialog.setParent(None)
        self.dialog.setWindowFlag(Qt.WindowStaysOnTopHint)
        self.dialog.move(QCursor.pos() + QPointF(20, 20).toPoint())
        self.dialog.show()

    def update_text(self):
        self.text.setPlainText(f"{self.node_id}\n({self.typ})")


class NodeDialog(QDialog):
    def __init__(self, node):
        super().__init__()
        self.node = node
        self.setWindowTitle("Node-Eigenschaften")

        layout = QFormLayout(self)

        self.id_edit = QLineEdit(node.node_id)
        self.typ_edit = QLineEdit(node.typ)
        self.beschreibung_edit = QLineEdit(node.beschreibung)
        self.bedingung_edit = QLineEdit(node.bedingung)
        self.mehrfach_edit = QLineEdit(str(node.mehrfach))
        self.effekte_edit = QLineEdit(json.dumps(node.effekte))
        self.setFlags_edit = QLineEdit(json.dumps(node.setFlags))

        layout.addRow("ID:", self.id_edit)
        layout.addRow("Typ:", self.typ_edit)
        layout.addRow("Beschreibung:", self.beschreibung_edit)
        layout.addRow("Bedingung (Flags & Alter):", self.bedingung_edit)
        layout.addRow("Mehrfach wählbar:", self.mehrfach_edit)
        layout.addRow("Effekte (JSON):", self.effekte_edit)
        layout.addRow("SetFlags (JSON):", self.setFlags_edit)

        buttons = QDialogButtonBox(QDialogButtonBox.Ok | QDialogButtonBox.Cancel)
        buttons.accepted.connect(self.accept)
        buttons.rejected.connect(self.reject)
        layout.addWidget(buttons)

    def accept(self):
        self.node.node_id = self.id_edit.text().strip()
        self.node.typ = self.typ_edit.text().strip()
        self.node.beschreibung = self.beschreibung_edit.text().strip()
        self.node.bedingung = self.bedingung_edit.text().strip()
        self.node.mehrfach = self.mehrfach_edit.text().lower() == 'true'
        self.node.effekte = json.loads(self.effekte_edit.text())
        self.node.setFlags = json.loads(self.setFlags_edit.text())

        # Automatisch setFlags setzen, falls leer und Typ ist entscheidung oder zufall
        if self.node.typ in ("entscheidung", "zufall") and not self.node.setFlags:
            self.node.setFlags = {self.node.node_id: True}

        self.node.update_text()
        super().accept()

class NodeEditor(QWidget):
    def __init__(self):
        super().__init__()
        self.scene = QGraphicsScene()
        self.scene.editor = self

        self.view = ZoomableGraphicsView(self.scene)
        self.nodes = []
        self.connections = []
        self.connection_start = None
        self.connection_preview = None
        self.last_dir = "."

        self.init_ui()

    def init_ui(self):
        add_button = QPushButton("➕ Node hinzufügen")
        add_button.clicked.connect(self.add_node)

        export_button = QPushButton("📤 JSON exportieren")
        export_button.clicked.connect(self.export_json)

        import_button = QPushButton("📥 JSON importieren")
        import_button.clicked.connect(self.import_json)

        btn_layout = QHBoxLayout()
        btn_layout.addWidget(add_button)
        btn_layout.addWidget(export_button)
        btn_layout.addWidget(import_button)

        layout = QVBoxLayout()
        layout.addLayout(btn_layout)
        layout.addWidget(self.view)

        self.setLayout(layout)
        self.setWindowTitle("GENERATIONS – Node Editor (PySide6)")
        self.resize(1000, 700)

    def add_node(self, x=None, y=None, data=None):
        if x is None: x = self.scene.width() / 2
        if y is None: y = self.scene.height() / 2
        label = data["id"] if data else f"Node{len(self.nodes)}"

        if any(n.node_id == label for n in self.nodes):
            print(f"⚠️ Node mit ID '{label}' existiert bereits – wird nicht erneut hinzugefügt.")
            return None

        if data and "typ" not in data:
            print(f"⛔ Ungültiger Node ignoriert: {label}")
            return None

        node = NodeItem(x, y, label)

        if data:
            node.typ = data.get("typ", "entscheidung")
            node.beschreibung = data.get("beschreibung", "")
            node.bedingung = data.get("bedingung", "")
            node.mehrfach = data.get("mehrfach", False)
            node.effekte = data.get("effekte", {})
            node.setFlags = data.get("setFlags", {})
            node.requireFlags = data.get("requireFlags", {})
            node.update_text()

        self.scene.addItem(node)
        self.nodes.append(node)
        return node

    def export_json(self):
        data = []
        known_ids = {node.node_id for node in self.nodes}
        known_nodes = {node.node_id: node for node in self.nodes}

        for node in self.nodes:
            valid_targets = []
            for conn, target in node.connections:
                if target in self.nodes and hasattr(target, 'node_id') and target.node_id in known_ids:
                    valid_targets.append(target.node_id)
                else:
                    print(
                        f"⚠️ Ungültige Verbindung von '{node.node_id}' zu '{getattr(target, 'node_id', '?')}' – wird nicht exportiert.")

            # Innerhalb der for-Schleife über self.nodes
            entry = {
                "id": node.node_id,
                "typ": node.typ,
                "beschreibung": node.beschreibung,
                "bedingung": node.bedingung.strip(),  # Standard: manuell gesetzter Wert
                "mehrfach": node.mehrfach,
                "effekte": node.effekte,
                "setFlags": node.setFlags,
                "requireFlags": node.requireFlags,
                "pos": [node.pos().x(), node.pos().y()],
                "verknuepfungen": valid_targets
            }

            # Automatisch gültige JS-Bedingung aus Flags ableiten, falls keine gesetzt ist
            if not entry["bedingung"] and isinstance(node.requireFlags, dict) and node.requireFlags:
                conditions = []
                for flag, val in node.requireFlags.items():
                    f = flag.strip().lower()
                    if isinstance(val, bool):
                        conditions.append(f"Flags['{f}'] === {str(val).lower()}")
                    else:
                        conditions.append(f"Flags['{f}'] == {repr(val)}")
                entry["bedingung"] = " && ".join(conditions)

            data.append(entry)

        filename, _ = QFileDialog.getSaveFileName(self, "Exportiere JSON", os.path.join(self.last_dir, "nodes.json"),
                                                  "JSON Files (*.json)")
        if filename:
            self.last_dir = os.path.dirname(filename)
            with open(filename, 'w', encoding='utf-8') as f:
                json.dump(data, f, ensure_ascii=False, indent=2)

    def import_json(self):
        filename, _ = QFileDialog.getOpenFileName(self, "Importiere JSON", self.last_dir, "JSON Files (*.json)")
        if not filename:
            return

        self.last_dir = os.path.dirname(filename)

        with open(filename, 'r', encoding='utf-8') as f:
            data = json.load(f)

        node_map = {}
        self.scene.clear()
        self.nodes.clear()
        self.connections.clear()

        # 1. Nodes erzeugen
        for node_data in data:
            pos = node_data.get("pos", [0, 0])
            node = self.add_node(pos[0], pos[1], node_data)
            if node:
                node_map[node.node_id] = node
            else:
                print(f"⚠️ Knoten '{node_data.get('id')}' konnte nicht hinzugefügt werden (ID doppelt?)")

        # 2. Verbindungen herstellen
        for node_data in data:
            source = node_map.get(node_data["id"])
            if not source:
                continue

            for target_id in node_data.get("verknuepfungen", []):
                target = node_map.get(target_id)
                if not target:
                    print(f"⚠️ Verbindung ignoriert – Zielknoten '{target_id}' nicht gefunden.")
                    continue

                conn = ConnectionLine(source, target)
                self.scene.addItem(conn)
                self.connections.append(conn)

if __name__ == '__main__':
    app = QApplication(sys.argv)
    editor = NodeEditor()
    editor.show()
    sys.exit(app.exec())