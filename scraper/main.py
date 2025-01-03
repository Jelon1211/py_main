from scrapy.crawler import CrawlerProcess
from scrapy.utils.project import get_project_settings
from scrapping.spiders.example_spider import ExampleSpider

if __name__ == "__main__":
    process = CrawlerProcess(settings=get_project_settings())
    
    process.crawl(ExampleSpider)
    process.start()