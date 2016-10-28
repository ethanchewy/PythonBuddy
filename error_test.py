def genr(n):
    i = 0
    while i < n:
        yield i
        i += 1

print list(genr(12))
