import scrapy

class ExampleSpider(scrapy.Spider):
    name = "example_spider"
    start_urls = ["http://example.com"]

    def parse(self, response):
        item = {
            "name": "Sample Item",
            "description": "This is a test description"
        }
        yield item
