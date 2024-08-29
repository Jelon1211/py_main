from scrapy.crawler import CrawlerProcess
from my_spider import AnimeNewsSpider

if __name__ == "__main__":
    process = CrawlerProcess()
    process.crawl(AnimeNewsSpider)
    process.start()