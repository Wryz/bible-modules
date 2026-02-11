import WidgetKit
import SwiftUI

struct BibleVerseEntry: TimelineEntry {
    let date: Date
    let verse: String
    let reference: String
    let postedAt: Date?
}

struct BibleVersesWidgetProvider: TimelineProvider {
    func placeholder(in context: Context) -> BibleVerseEntry {
        BibleVerseEntry(
            date: Date(),
            verse: "For God so loved the world that he gave his one and only Son, that whoever believes in him shall not perish but have eternal life.",
            reference: "John 3:16",
            postedAt: Date()
        )
    }
    
    func getSnapshot(in context: Context, completion: @escaping (BibleVerseEntry) -> Void) {
        let entry = BibleVerseEntry(
            date: Date(),
            verse: "For God so loved the world that he gave his one and only Son, that whoever believes in him shall not perish but have eternal life.",
            reference: "John 3:16",
            postedAt: Date()
        )
        completion(entry)
    }
    
    func getTimeline(in context: Context, completion: @escaping (Timeline<BibleVerseEntry>) -> Void) {
        // Load verse from shared UserDefaults (App Group)
        let sharedDefaults = UserDefaults(suiteName: "group.com.bibleversesapp")
        let verse = sharedDefaults?.string(forKey: "currentVerse") ?? "For God so loved the world that he gave his one and only Son, that whoever believes in him shall not perish but have eternal life."
        let reference = sharedDefaults?.string(forKey: "currentReference") ?? "John 3:16"
        
        // Load timestamp
        var postedAt: Date? = nil
        if let timestampString = sharedDefaults?.string(forKey: "verseTimestamp") {
            let formatter = ISO8601DateFormatter()
            postedAt = formatter.date(from: timestampString)
        }
        
        // Get refresh frequency setting
        let refreshFrequency = sharedDefaults?.string(forKey: "refreshFrequency") ?? "daily"
        var hoursUntilUpdate: Int = 24
        
        switch refreshFrequency {
        case "hourly":
            hoursUntilUpdate = 1
        case "daily":
            hoursUntilUpdate = 24
        case "custom":
            hoursUntilUpdate = sharedDefaults?.integer(forKey: "customHours") ?? 24
        case "onAppOpen":
            hoursUntilUpdate = 0
            let minutesUntilUpdate = 5
            let entry = BibleVerseEntry(
                date: Date(),
                verse: verse,
                reference: reference,
                postedAt: postedAt ?? Date()
            )
            let nextUpdate = Calendar.current.date(byAdding: .minute, value: minutesUntilUpdate, to: Date())!
            let timeline = Timeline(entries: [entry], policy: .after(nextUpdate))
            completion(timeline)
            return
        default:
            hoursUntilUpdate = 24
        }
        
        let entry = BibleVerseEntry(
            date: Date(),
            verse: verse,
            reference: reference,
            postedAt: postedAt ?? Date()
        )
        
        let nextUpdate = Calendar.current.date(byAdding: .hour, value: hoursUntilUpdate, to: Date())!
        let timeline = Timeline(entries: [entry], policy: .after(nextUpdate))
        completion(timeline)
    }
}

// Helper to convert hex string to Color
extension Color {
    init(hex: String) {
        let hex = hex.trimmingCharacters(in: CharacterSet.alphanumerics.inverted)
        var int: UInt64 = 0
        Scanner(string: hex).scanHexInt64(&int)
        let a, r, g, b: UInt64
        switch hex.count {
        case 3: // RGB (12-bit)
            (a, r, g, b) = (255, (int >> 8) * 17, (int >> 4 & 0xF) * 17, (int & 0xF) * 17)
        case 6: // RGB (24-bit)
            (a, r, g, b) = (255, int >> 16, int >> 8 & 0xFF, int & 0xFF)
        case 8: // ARGB (32-bit)
            (a, r, g, b) = (int >> 24, int >> 16 & 0xFF, int >> 8 & 0xFF, int & 0xFF)
        default:
            (a, r, g, b) = (255, 0, 0, 0)
        }
        self.init(
            .sRGB,
            red: Double(r) / 255,
            green: Double(g) / 255,
            blue: Double(b) / 255,
            opacity: Double(a) / 255
        )
    }
}

struct BibleVersesWidgetEntryView: View {
    var entry: BibleVerseEntry
    @Environment(\.widgetFamily) var family
    
    var backgroundColor: Color {
        return Color.black
    }
    
    var textColor: Color {
        return Color(hex: "F5F5F7")
    }
    
    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            HStack(alignment: .center, spacing: 8) {
                // Reference header
                Text(entry.reference.uppercased())
                    .font(.system(size: family == .systemMedium ? 15 : 14, weight: .semibold, design: .default))
                    .foregroundColor(.white)
                    .tracking(0.5)
                
                Spacer()
            }
            .padding(.bottom, family == .systemMedium ? 6 : 14)
            
            // Verse text with serif font - increased sizes for both medium and large widgets
            Text(entry.verse)
                .font(.custom("Times New Roman", size: family == .systemMedium ? 16 : 20))
                .foregroundColor(textColor)
                .lineSpacing(family == .systemMedium ? 3 : 10)
                .multilineTextAlignment(.leading)
                .lineLimit(nil)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
        .padding(family == .systemMedium ? 12 : 24)
        .containerBackground(backgroundColor, for: .widget)
    }
}

struct BibleVersesWidget: Widget {
    let kind: String = "BibleVersesWidget"
    
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: BibleVersesWidgetProvider()) { entry in
            BibleVersesWidgetEntryView(entry: entry)
        }
        .configurationDisplayName("Bible Verse")
        .description("Display daily Bible verses on your home screen.")
        .supportedFamilies([.systemMedium, .systemLarge])
    }
}

struct BibleVersesWidget_Previews: PreviewProvider {
    static var previews: some View {
        BibleVersesWidgetEntryView(
            entry: BibleVerseEntry(
                date: Date(),
                verse: "For God so loved the world that he gave his one and only Son, that whoever believes in him shall not perish but have eternal life.",
                reference: "John 3:16",
                postedAt: Date().addingTimeInterval(-3600)
            )
        )
        .previewContext(WidgetPreviewContext(family: .systemMedium))
    }
}
