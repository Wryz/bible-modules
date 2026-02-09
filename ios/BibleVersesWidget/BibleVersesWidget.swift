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
            // For onAppOpen, refresh every 5 minutes to catch updates when app opens
            // The main update happens when the app comes to foreground
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
        
        // Update based on user's refresh frequency setting
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
    
    // Load theme colors from UserDefaults
    var primaryColor: Color {
        let sharedDefaults = UserDefaults(suiteName: "group.com.bibleversesapp")
        // Always use the synced primary color (includes custom colors)
        if let hexColor = sharedDefaults?.string(forKey: "themePrimaryColor") {
            return Color(hex: hexColor)
        }
        // Fallback to theme-based default colors if not synced yet
        let themeName = sharedDefaults?.string(forKey: "themeName") ?? "dark"
        switch themeName {
        case "light":
            return Color(hex: "007AFF")
        case "wood":
            return Color(hex: "8B4513")
        default: // dark
            return Color(hex: "5B8FF9")
        }
    }
    
    var backgroundColor: Color {
        let sharedDefaults = UserDefaults(suiteName: "group.com.bibleversesapp")
        let themeName = sharedDefaults?.string(forKey: "themeName") ?? "dark"
        // Force dark background for both medium and large widgets
        switch themeName {
        case "light":
            // Use dark background even for light theme in widgets for consistency
            return Color(hex: "1E1E1E")
        case "wood":
            return Color(hex: "FFF8DC")
        default: // dark
            return Color(hex: "1E1E1E")
        }
    }
    
    var textColor: Color {
        let sharedDefaults = UserDefaults(suiteName: "group.com.bibleversesapp")
        let themeName = sharedDefaults?.string(forKey: "themeName") ?? "dark"
        // Use light text for dark background (consistent for both medium and large)
        switch themeName {
        case "light":
            // Use light text since we're forcing dark background
            return Color(hex: "F5F5F7")
        case "wood":
            return Color(hex: "3E2723")
        default: // dark
            return Color(hex: "F5F5F7")
        }
    }
    
    var secondaryTextColor: Color {
        let sharedDefaults = UserDefaults(suiteName: "group.com.bibleversesapp")
        let themeName = sharedDefaults?.string(forKey: "themeName") ?? "dark"
        // Use light secondary text for dark background
        switch themeName {
        case "light":
            // Use light secondary text since we're forcing dark background
            return Color(hex: "D1D1D6")
        case "wood":
            return Color(hex: "5D4037")
        default: // dark
            return Color(hex: "D1D1D6")
        }
    }
    
    // Format time since posted (matching HomeScreen format)
    func formatTimeAgo(_ date: Date) -> String {
        let now = Date()
        let diffSeconds = now.timeIntervalSince(date)
        let diffMins = Int(diffSeconds / 60)
        let diffHours = Int(diffSeconds / 3600)
        let diffDays = Int(diffSeconds / 86400)
        
        if diffMins < 1 {
            return "Just now"
        } else if diffMins < 60 {
            return "\(diffMins)m ago"
        } else if diffHours < 24 {
            return "\(diffHours)h ago"
        } else if diffDays < 7 {
            return "\(diffDays)d ago"
        } else {
            let formatter = DateFormatter()
            formatter.dateFormat = "MMM d"
            return formatter.string(from: date)
        }
    }
    
    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            HStack(alignment: .center, spacing: 8) {
                // Reference header
                Text(entry.reference.uppercased())
                    .font(.system(size: family == .systemMedium ? 15 : 14, weight: .semibold, design: .default))
                    .foregroundColor(primaryColor)
                    .tracking(0.5)
                
                // Time since posted
                if let postedAt = entry.postedAt {
                    Text("•")
                        .font(.system(size: family == .systemMedium ? 13 : 12, weight: .regular))
                        .foregroundColor(secondaryTextColor)
                    Text(formatTimeAgo(postedAt))
                        .font(.system(size: family == .systemMedium ? 13 : 12, weight: .regular))
                        .foregroundColor(secondaryTextColor)
                }
                
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
                postedAt: Date().addingTimeInterval(-3600) // 1 hour ago
            )
        )
        .previewContext(WidgetPreviewContext(family: .systemMedium))
    }
}
