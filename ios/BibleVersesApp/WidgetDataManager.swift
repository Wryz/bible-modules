import Foundation
import WidgetKit
import React

@objc(WidgetDataManager)
class WidgetDataManager: NSObject {
  
  @objc
  static func requiresMainQueueSetup() -> Bool {
    return false
  }
  
  @objc
  func updateVerse(_ verse: String, reference: String, resolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
    // Use App Group to share data with widget
    let sharedDefaults = UserDefaults(suiteName: "group.com.bibleversesapp")
    sharedDefaults?.set(verse, forKey: "currentVerse")
    sharedDefaults?.set(reference, forKey: "currentReference")
    // Save timestamp when verse is updated
    let timestamp = ISO8601DateFormatter().string(from: Date())
    sharedDefaults?.set(timestamp, forKey: "verseTimestamp")
    sharedDefaults?.synchronize()
    
    // Reload widget timeline
    WidgetCenter.shared.reloadTimelines(ofKind: "BibleVersesWidget")
    
    resolve(true)
  }
  
  @objc
  func updateWidgetSettings(_ frequency: String, customHours: NSNumber?, resolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
    let sharedDefaults = UserDefaults(suiteName: "group.com.bibleversesapp")
    sharedDefaults?.set(frequency, forKey: "refreshFrequency")
    if let hours = customHours {
      sharedDefaults?.set(hours.intValue, forKey: "customHours")
    }
    sharedDefaults?.synchronize()
    
    // Reload widget timeline
    WidgetCenter.shared.reloadTimelines(ofKind: "BibleVersesWidget")
    
    resolve(true)
  }
  
  @objc
  func updateThemeColors(_ primaryColor: String?, resolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
    let sharedDefaults = UserDefaults(suiteName: "group.com.bibleversesapp")
    if let primary = primaryColor {
      sharedDefaults?.set(primary, forKey: "themePrimaryColor")
    } else {
      sharedDefaults?.removeObject(forKey: "themePrimaryColor")
    }
    sharedDefaults?.synchronize()
    
    // Reload widget timeline to apply new colors
    WidgetCenter.shared.reloadTimelines(ofKind: "BibleVersesWidget")
    
    resolve(true)
  }
  
  @objc
  func updateThemeName(_ themeName: String, resolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
    let sharedDefaults = UserDefaults(suiteName: "group.com.bibleversesapp")
    sharedDefaults?.set(themeName, forKey: "themeName")
    sharedDefaults?.synchronize()
    
    // Reload widget timeline to apply new theme
    WidgetCenter.shared.reloadTimelines(ofKind: "BibleVersesWidget")
    
    resolve(true)
  }
}
