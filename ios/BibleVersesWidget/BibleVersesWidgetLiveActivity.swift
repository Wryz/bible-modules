//
//  BibleVersesWidgetLiveActivity.swift
//  BibleVersesWidget
//
//  Created by My Phung on 2/8/26.
//

import ActivityKit
import WidgetKit
import SwiftUI

struct BibleVersesWidgetAttributes: ActivityAttributes {
    public struct ContentState: Codable, Hashable {
        // Dynamic stateful properties about your activity go here!
        var emoji: String
    }

    // Fixed non-changing properties about your activity go here!
    var name: String
}

struct BibleVersesWidgetLiveActivity: Widget {
    var body: some WidgetConfiguration {
        ActivityConfiguration(for: BibleVersesWidgetAttributes.self) { context in
            // Lock screen/banner UI goes here
            VStack {
                Text("Hello \(context.state.emoji)")
            }
            .activityBackgroundTint(Color.cyan)
            .activitySystemActionForegroundColor(Color.black)

        } dynamicIsland: { context in
            DynamicIsland {
                // Expanded UI goes here.  Compose the expanded UI through
                // various regions, like leading/trailing/center/bottom
                DynamicIslandExpandedRegion(.leading) {
                    Text("Leading")
                }
                DynamicIslandExpandedRegion(.trailing) {
                    Text("Trailing")
                }
                DynamicIslandExpandedRegion(.bottom) {
                    Text("Bottom \(context.state.emoji)")
                    // more content
                }
            } compactLeading: {
                Text("L")
            } compactTrailing: {
                Text("T \(context.state.emoji)")
            } minimal: {
                Text(context.state.emoji)
            }
            .widgetURL(URL(string: "http://www.apple.com"))
            .keylineTint(Color.red)
        }
    }
}

extension BibleVersesWidgetAttributes {
    fileprivate static var preview: BibleVersesWidgetAttributes {
        BibleVersesWidgetAttributes(name: "World")
    }
}

extension BibleVersesWidgetAttributes.ContentState {
    fileprivate static var smiley: BibleVersesWidgetAttributes.ContentState {
        BibleVersesWidgetAttributes.ContentState(emoji: "😀")
     }
     
     fileprivate static var starEyes: BibleVersesWidgetAttributes.ContentState {
         BibleVersesWidgetAttributes.ContentState(emoji: "🤩")
     }
}

#Preview("Notification", as: .content, using: BibleVersesWidgetAttributes.preview) {
   BibleVersesWidgetLiveActivity()
} contentStates: {
    BibleVersesWidgetAttributes.ContentState.smiley
    BibleVersesWidgetAttributes.ContentState.starEyes
}
