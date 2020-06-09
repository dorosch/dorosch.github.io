---
layout: post
title:  "Game engine from scratch - part 1"
date:   2020-06-09 09:00:00 +0300
categories: c++ 3d-engine
---

In this series of posts we'll try create 3d game engine on from scratch.
When I say `from scratch` I don't mean technologies or the algorithms it's
only about our capabilities. We're goint to use `c++17` as primary language
and library `SDL2` as graphical environment but from it we'll use only ability
to draw a pixel on the screen and interact with the keyboard and mouse.

We'll focus on development under `linux` but the approaches used are not very
platform dependent and if desired the engine can easily be ported to other
systems. As a result, we get dynamic library `libengine.so` for linux based
systems.


## Introduction

We wanna draw a line from a point $$A(x_0, y_0)$$ to the point $$B(x_1, y_1)$$.
Logically if you need to draw the line you would move from point $$A$$ to
point $$B$$ on some distance. Something like this:

$$P = P_0 + t(P_1 - P_0)$$

You can expand the equation for each of the coordinates:

$$\begin{align*}
    x = x_0 + t(x_1 - x_0) \\
    y = y_0 + t(y_1 - y_0)
\end{align*}$$

From the first equation we calculate $$t$$:

$$x = x_0 + t(x_1 - x_0)$$

$$x - x_0 = t(x_1 - x_0)$$

$${x - x_0 \over x_1 - x_0} = t$$

And we can substitute $$t$$ in the second equation:

$$y = y_0 + t(y_1 - y_0)$$

$$y = y_0 + {x - x_0 \over x_1 - x_0}(y_1 - y_0)$$

Part of the equation $${x - x_0 \over x_1 - x_0}$$ need to calculate on each
step but we can change the equation a little:

$$y = y_0 + (x - x_0) {y_1 - y_0 \over x_1 - x_0}$$

And now it’s $${y_1 - y_0 \over x_1 - x_0}$$ part that the part depends only
on coordinates of the beginning and end of the segment which we already know.
We note this part as a constant $$k$$:

$$y = y_0 + k(x - x_0)$$

Opening the brackets we get:

$$y = y_0 + kx - kx_0$$

Simplify a bit:

$$y = kx + (y_0 - kx_0)$$

The part $$(y_0 - kx_0)$$ again depends only on the initial coordinates we
note it by the constant $$b$$. The whole line equation looks like:

$$y = kx + b$$

We know this equation from a school mathematic and now we know how it works.
Let's code our line:

```c++
class Line: public AbstractPrimitive {
public:
    Line(Render *render): AbstractPrimitive(render) {}

    void draw(int x0, int y0, int x1, int y1, SDL_Color color=WHITE) {
        float k = (y1 - y0)/(x1 - x0);
        float b = y0 - k * x0;

        for (int x = x0; x < x1; x++) {
            int y = (k * x) + b;
            Line::render->draw(x, y, color);
        }
    }
};
```
