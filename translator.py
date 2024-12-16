#!/usr/bin/env python

from html.parser import HTMLParser
import json, re, os, urllib.request

VIDEOS_URL     = "https://fediverse.tv/feeds/videos.json?videoChannelId=22300"
CONTENT_FILTER = "outer wilds"
ENTRIES_FILE   = "src/data/assets/entries.json"

class ShiplogEntriesParser(HTMLParser):
  def __init__(self):
    super().__init__()
    self.tagged_entries = []
  def handle_data(self, data):
    matches = re.findall(r"(\[.*?\])\s*(.*?)(?=(\[|$))", data)
    for id, text, _ in matches:
      self.tagged_entries.append({
        "id":   id.strip("[]"),
        "text": text.strip("[]")
      })

def find_key(data, key_name):
  """Find first 'key_name' value in a JSON"""
  if isinstance(data, dict):
    if key_name in data:
      return data[key_name]
    for value in data.values():
      result = find_key(value, key_name)
      if result is not None:
        return result
  elif isinstance(data, list):
    for item in data:
      result = find_key(item, key_name)
      if result is not None:
        return result
  return None

def find_text_from_id(data, id_name):
  """Find the 'text' value of the dict with 'id'==id_name in a JSON"""
  if isinstance(data, dict):
    if data.get("id") == id_name:
      return data.get("text", None)
    for value in data.values():
      result = find_text_from_id(value, id_name)
      if result is not None:
        return result
  elif isinstance(data, list):
      for item in data:
        result = find_text_from_id(item, id_name)
        if result is not None:
          return result
  return None

if __name__ == "__main__":

  with urllib.request.urlopen(VIDEOS_URL) as response:
    json_url = json.loads(response.read().decode("utf-8"))

  tagged_entries_from_videos = []
  for item in json_url["items"]:
    if CONTENT_FILTER in item["title"]:
      content_html = find_key(json_url, "content_html")
      parser = ShiplogEntriesParser()
      parser.feed(content_html)
      tagged_entries_from_videos += parser.tagged_entries

  with open(ENTRIES_FILE, encoding="utf-8") as filedescriptor:
    json_file = json.load(filedescriptor)

  for entry in tagged_entries_from_videos:
    tag = entry["id"]
    old_text = find_text_from_id(json_file, tag)
    if old_text is not None:
      new_text = find_text_from_id(tagged_entries_from_videos, tag)
      if new_text is not None:
        old_text = old_text.replace('"','\\\\\\\\\\"')
        new_text = new_text.replace('"','\\\\\\\\\\"')
        command = f'sed -i "s/{old_text}/{new_text}/g" "{ENTRIES_FILE}"'
        print(command)
        os.system(command)
