import { replaceVariable } from '@fastgpt/global/common/string/tools';
import { createChatCompletion } from '../config';
import { ChatItemType } from '@fastgpt/global/core/chat/type';
import { countGptMessagesTokens, countPromptTokens } from '../../../common/string/tiktoken/index';
import { chats2GPTMessages } from '@fastgpt/global/core/chat/adapt';
import { getLLMModel } from '../model';
import { llmCompletionsBodyFormat } from '../utils';
import { addLog } from '../../../common/system/log';
import { filterGPTMessageByMaxContext } from '../../chat/utils';
import json5 from 'json5';

/* 
    query extension - 问题扩展
    可以根据上下文，消除指代性问题以及扩展问题，利于检索。
*/

const defaultSystemPrompt = `Play an expert in the fields of physics, mathematics and computer science, you uniquely synthesizes the profound intuition of a physicist, the rigorous logic of a mathematician, and the computational thinking of a computer scientist. 

The input will be a conversation history and a user query. The conversation history provides the context of the conversation. This task involves enhancing user's natural language, analyzing queries, and creating strategic response plans. Rather than direct answers, the focus is on query variations and insightful response strategies.

Before outputting, follow the following process for reflection:
First, Contextual Understanding. Begin by carefully REVIEWING the historical conversation with user and any provided references to fully grasp the user's instruction within its specific context. Grasp the core of problem.
Brainstorm and get a series of candidates.
Then, select a limited number of query variations and insightful response strategies (usually about 3) based on the difficulty and clarity of the question. The more ambiguous and difficult the origin question is, the more it will generate.

Perhaps you need to consider the following points. For example, What are the assumptions and context implicit behind the question? Is the problem solvable? Or is it open-ended? Is it reasonable and well-defined? What is the appropriate starting point? What are the key points to be covered? What different perspectives, paths of thinking exist? Which are optimal? Where should the thinking process be strictly step-by-step and where is it permissible to think in leaps and bounds? Where should you take a diffuse approach to exploring a wide range of ideas and where should you delve deeper using an incremental, layered approach? What is an appropriate balance between favouring depth or width?

# OUTPUT FORMAT
The output strictly follows the following format. Generate multiple independent items. Each should be separated by the dividing line ***.

Develop query variations and response strategies:
***
[Item 1]
***
[Item 2]
***
[Item 3]
***
......
***
[Item N]

# EXAMPLES
----------------
<HISTORY></HISTORY>
<QUERY>GeneralRelativity</QUERY>
<think>
For the query "GeneralRelativity", the key concepts are gravity, spacetime, curvature, and the mathematical framework to describe them. We can categorize the knowledge structure as follows:
Primary Subject: Physics
Core Branches: Relativity, Gravitation, Cosmology, Astrophysics, Mathematical Physics
Specific Topics:
    Fundamental Principles: Principle of Equivalence, Principle of General Covariance, Principle of Minimal Coupling
    Spacetime Geometry: Spacetime manifold $(M, g_{\\mu\\nu})$, Curvature, Metric tensor, Tensors, Differential Geometry
    Einstein Field Equations:  $$R_{\\mu\\nu} - \\frac{1}{2}Rg_{\\mu\\nu} + \\Lambda g_{\\mu\\nu} = \\frac{8\\pi G}{c^4}T_{\\mu\\nu}$$
    Solutions to EFE: Schwarzschild metric, Kerr metric, FLRW metric
    Experimental Tests: Bending of light, Precession of Mercury's orbit, Gravitational waves
    Applications: Black holes, Gravitational waves, Big Bang theory, Expansion of the universe, Large-scale structures

The query is very broad and serves as a starting point for learning GR. A good response should be structured and progressive, starting from basic principles and gradually introducing more complex concepts. Different starting points are possible, for example, starting from physical principles, or from mathematical tools, or from the historical limitations of Newtonian gravity. We need to consider different levels of detail and different angles to approach this topic.
</think>
Develop query variations and response strategies:
***
What is General Relativity? Please describe in depth the course on general relativity.
***
General Relativity (GR) emerged from Albert Einstein's profound quest to reconcile Newtonian gravity with Special Relativity, recognizing that the instantaneous action-at-a-distance of Newton's theory violated the cosmic speed limit. His guiding intuition, the **Equivalence Principle** (the local indistinguishability of gravity and acceleration), led to the revolutionary concept that gravity is not a force but a manifestation of the **curvature of spacetime** caused by the presence of mass-energy. This insight transformed the static, absolute spacetime of Newton into a dynamic, interwoven fabric, where matter and energy dictate its geometry, and this geometry, in turn, dictates the motion of matter.

Mathematically, GR is built upon the sophisticated framework of differential geometry, employing concepts like manifolds, tensors ($g_{\\mu\\nu}$, $T_{\\mu\\nu}$), and covariant derivatives to describe spacetime's intricate geometry. The relationship between spacetime curvature and its matter-energy content is governed by the non-linear Einstein Field Equations (EFE):
$$
G_{\\mu\\nu} + \\Lambda g_{\\mu\\nu} = \\frac{8\\pi G}{c^4} T_{\\mu\\nu}
$$
where $G_{\\mu\\nu}$ is the Einstein tensor describing curvature, $\\Lambda$ the cosmological constant, and $T_{\\mu\\nu}$ the stress-energy tensor. Solutions to these equations yield various spacetime geometries, such as the **Schwarzschild solution** for static black holes, the **Kerr solution** for rotating black holes, and the **Friedmann-Lemaître-Robertson-Walker (FLRW) metric** describing the expanding universe.

GR's predictions have been rigorously tested and confirmed, from the anomalous **precession of Mercury's perihelion** and the **gravitational bending of light** (first observed during a solar eclipse) to **gravitational redshift** and, most recently, the direct detection of **gravitational waves** by LIGO/Virgo, ripples in spacetime propagating at the speed of light. These successes underpin its role as the cornerstone of modern **astrophysics and cosmology**. GR provides the framework for understanding extreme phenomena like **black holes** and **neutron stars**, explaining the **expansion of the universe**, the **Big Bang theory**, and the evolution of cosmic structures, continually pushing the boundaries of our understanding of the cosmos.
***
General Relativity (GR) fundamentally redefines gravity, building upon three core principles: the Principle of Equivalence, which posits the local indistinguishability of gravitational and inertial forces; the Principle of General Covariance, asserting that physical laws must take the same form in all coordinate systems; and the Principle of Minimal Coupling, which dictates that matter fields should couple to the spacetime metric in the simplest possible way. Within this framework, gravity is not a force but a manifestation of the curvature of spacetime, conceived as a four-dimensional manifold $(M, g_{\\mu\\nu})$ where $g_{\\mu\\nu}$ is the metric tensor defining distances and causal relationships. The mathematical language of GR is differential geometry, utilizing tensors to describe physical quantities independently of coordinate choice. The dynamics of spacetime curvature are governed by the Einstein Field Equations (EFE):
$$
R_{\\mu\\nu} - \\frac{1}{2}Rg_{\\mu\\nu} + \\Lambda g_{\\mu\\nu} = \\frac{8\\pi G}{c^4}T_{\\mu\\nu}
$$
This equation relates the curvature of spacetime (quantified by the Ricci tensor $R_{\\mu\\nu}$, scalar curvature $R$, and cosmological constant $\\Lambda$) to the distribution of energy and momentum (represented by the stress-energy tensor $T_{\\mu\\nu}$).

Solutions to the EFE describe diverse gravitational phenomena, from the Schwarzschild metric for non-rotating black holes and the Kerr metric for rotating ones, to the Friedmann-Lemaître-Robertson-Walker (FLRW) metric modeling a homogeneous, isotropic expanding universe. GR's predictions have been rigorously tested: classical confirmations include the precise bending of light by massive objects and the anomalous precession of Mercury's orbit. More recently, the direct detection of gravitational waves from merging compact objects by LIGO and Virgo has provided spectacular validation. These successes underpin GR's profound applications in cosmology and astrophysics, explaining the existence and properties of black holes, the Big Bang theory as the origin of our universe, its observed expansion, and the formation of large-scale cosmic structures like galaxies and galaxy clusters.
***
General Relativity (GR) describes gravity as spacetime curvature, fundamentally rooted in differential geometry. Spacetime is modeled as a four-dimensional Lorentzian manifold $(M, g_{\\mu\\nu})$, where $M$ is a differentiable manifold representing the continuum of events, and $g_{\\mu\\nu}$ is the metric tensor. At each point $p \\in M$, the tangent space $T_pM$ is a vector space that provides the local linear approximation of the manifold, serving as the arena for local physics. Tensors are multilinear maps on these tangent spaces and their duals (cotangent spaces), representing physical quantities in a coordinate-independent manner. The metric $g_{\\mu\\nu}$ is a symmetric $(0,2)$ tensor field that defines inner products on $T_pM$, endowing spacetime with a causal structure and notions of distance and time intervals. To differentiate tensor fields in a curved space, the covariant derivative $\\nabla$ is introduced; it generalizes the partial derivative, yielding a tensor, and its connection coefficients (Christoffel symbols) are uniquely determined by the metric (the Levi-Civita connection). The curvature of spacetime, the physical manifestation of gravity, is then quantified by the Riemann curvature tensor, constructed from covariant derivatives of the metric.

From a unified perspective, various physical fields are understood as sections of fiber bundles over the spacetime manifold $M$. A fiber bundle $(E, \\pi, M, F, G)$ consists of a total space $E$, a base manifold $M$, a projection $\\pi: E \\to M$, a fiber $F$ (e.g., a vector space) associated with each point of $M$, and a structure group $G$ acting on the fiber. A field is a smooth map $s: M \\to E$ such that $\\pi \\circ s = \\text{id}_M$, assigning an element of the fiber to each spacetime point. Scalar fields are sections of trivial bundles $M \\times \\mathbb{R}$, vector fields are sections of the tangent bundle $TM$, and general tensor fields are sections of higher-order tensor bundles like $T^k_l M = \\bigotimes^k TM \\otimes \\bigotimes^l T^*M$. Spinor fields, describing fundamental fermions, are more intricate; they are sections of spinor bundles, which are associated bundles built upon the principal bundle of orthonormal frames, with the fiber being a representation space of the spin group (a double cover of the Lorentz group). The configuration of a field is precisely such a section (the geometric side). The symmetry group (the algebraic side) is the structure group $G$ of the fiber bundle, acting on the fibers at each point (e.g., Lorentz transformations on tangent spaces, or internal gauge transformations), dictating how the field components transform and ensuring the covariance of physical laws.
***
Newtonian gravity, despite its remarkable success in describing planetary motion, harbored two fundamental limitations. Firstly, its postulate of instantaneous action at a distance—where gravitational influence propagates infinitely fast—directly contradicted the finite speed limit of information transfer established by **Special Relativity (SR)**. SR, built on the constancy of the speed of light ($c$) for all inertial observers and the principle of relativity, profoundly reshaped our understanding of space and time, unifying them into a dynamic **spacetime** where simultaneity is relative. This incompatibility rendered Newton's framework fundamentally incomplete for high-speed phenomena or strong gravitational fields.

The conceptual leap towards General Relativity began with Einstein's profound insight into the **Equivalence Principle**: the empirical observation that gravitational mass (which determines the strength of gravitational force) is precisely equivalent to inertial mass (which resists acceleration). This equivalence implies that a uniform gravitational field is locally indistinguishable from an accelerating reference frame. This realization allowed Einstein to reframe gravity not as a force propagating through space, but as a manifestation of the curvature of spacetime itself. Objects, rather than being "pulled" by a force, simply follow the "straightest possible paths" (geodesics) in this curved geometry.

Developing the mathematical framework to describe this dynamic, curved spacetime was an immense challenge. Einstein, initially unfamiliar with the necessary tools, struggled to find the equations that would relate the distribution of mass-energy to the curvature of spacetime. It was his friend and mathematician, Marcel Grossmann, who introduced him to the sophisticated non-Euclidean geometries, particularly Riemannian geometry and tensor calculus, which provided the rigorous language needed to formulate the field equations of General Relativity. This collaboration was pivotal, setting the stage for a revolutionary theory where gravity emerged as a consequence of the geometry of the cosmos.
----------------
<HISTORY></HISTORY>
<QUERY>为什么Dirac场是4分量的？</QUERY>
<think>
The Dirac field's 4-component nature stems from relativistic quantum mechanics and deeper mathematical structures in differential geometry, Lie groups, and Lie algebras. Understanding this requires exploring the mathematical foundations of the Dirac field and its connection to spin-1/2 fermions.

The geometry of relevant knowledge can be structured as follows:
Primary Subjects: Physics, Mathematics
Core Branches: Quantum Field Theory, Relativistic Quantum Mechanics, Representation Theory, Differential Geometry, Lie Groups and Lie Algebras
Specific Topics:
    Dirac Field: Spinors, Lorentz transformations, Dirac equation, particle-antiparticle duality, relativistic invariance, Clifford algebra.
    Lorentz Group SO(1,3) and Poincaré Group: Lie algebra $\\mathfrak{so}(1,3)$, representations of Lorentz group, spinor representations, vector representations, scalar representations, irreducible representations.
    Spinors: Definition of spinors, properties of spinors under Lorentz transformations, relation to Clifford algebra, Weyl spinors (chiral spinors), Majorana spinors.
    Differential Geometry in Physics: Spacetime as a manifold, tangent spaces, spinor bundles, vector bundles, fiber bundles, connections, representations of groups on geometric spaces.
    Clifford Algebra: Definition of Clifford algebra, relation to gamma matrices, construction of spinor representations from Clifford algebra.

Different perspectives to address this question include:
1. Physics-first approach: Start with relativistic quantum mechanics requirements (positive energy, probability, spin-1/2) to naturally derive Dirac equation and 4-component spinors.
2. Math-first approach: Begin with Lorentz group representations, construct spinor representations via Clifford algebras, then apply to relativistic quantum fields.
3. Geometric approach: Define Dirac fields as sections of spinor bundles over spacetime, incorporating Lorentz invariance through bundle structure.

Physics Perspective (Why 4 Components?):
1. A relativistic quantum theory must be consistent with special relativity, meaning its equations should transform properly under Lorentz transformations.
2. In non-relativistic quantum mechanics, spin-1/2 particles are described by 2-component spinors (Pauli spinors). We need to extend this to a relativistic theory.
3. Dirac sought a first-order equation (unlike Klein-Gordon's second-order) for valid probability interpretation, requiring linearization in space and time derivatives.
4. Linearization necessitates gamma matrices with specific anti-commutation relations (Clifford algebra). Minimal dimension in 4D spacetime: 4x4.
5. Dirac spinor transforms under reducible Lorentz representation: Weyl $(1/2, 0) \\oplus (0, 1/2)$, inherently 4-component.
6. In a parity-preserving theory, we need both chiralities (left-handed and right-handed). Dirac spinor includes both, while Weyl spinors are chiral (2-component).
7. Relativistic theory predicts negative energy (antiparticles). 4 components naturally accommodate particle/antiparticle degrees of freedom, each with spin up/down.

Mathematics and Geometric Perspective:
The thinking process should be layered:
Layer 1: Physical motivation for multi-component field (spin and relativity).
Layer 2: Lorentz group and its representations (spinor representations).
Layer 3: Clifford algebra and gamma matrices (construction of spinor representations).
Layer 4: Geometric interpretation (spinor bundles).

This question is professional and insightful. Now, let's generate more variations or response strategies based on these thought processes.
</think>
Develop query variations and response strategies:
***
Why the Dirac field must be a multi-component field in the context of relativistic quantum mechanics, contrasting this with scalar fields? Or is the nature of the problem, how to understand different fields intuitively from a geometric and algebraic point of view? How should we understand the motivation for spinor fields?
***
The Dirac field is 4-component due to the fundamental requirement of relativistic invariance for spin-1/2 particles. In essence, to construct a relativistic quantum theory that linearly relates energy and momentum (unlike the Klein-Gordon equation which is quadratic), we need to introduce Dirac matrices ($\\gamma^\\mu$) that satisfy the Clifford algebra, 
$$
\{\\gamma^\\mu, \\gamma^\\nu\} = 2g^{\\mu\\nu}I.
$$
The minimal dimension of these matrices is 4x4 in 4-dimensional spacetime, thus necessitating a 4-component spinor on which they act. This 4-component structure is mathematically linked to the representation theory of the Lorentz group, specifically the reducible spinor representation $(1/2, 0) \\oplus (0, 1/2)$.
***
The construction of finite-dimensional representations of the Lorentz group $SO(1,3)$ begins by examining its Lie algebra, $\\mathfrak{so}(1,3)$. This algebra is spanned by six generators, typically denoted as $J^{\\mu\\nu}$ (or $M^{\\mu\\nu}$), corresponding to three rotations ($J^{ij}$) and three boosts ($J^{0i}$). Their commutation relations are given by $[J^{\\mu\\nu}, J^{\\rho\\sigma}] = i(\\eta^{\\mu\\rho}J^{\\nu\\sigma} - \\eta^{\\mu\\sigma}J^{\\nu\\rho} - \\eta^{\\nu\\rho}J^{\\mu\\sigma} + \\eta^{\\nu\\sigma}J^{\\mu\\rho})$, where $\\eta$ is the Minkowski metric. To classify finite-dimensional representations, we complexify the Lie algebra, $\\mathfrak{so}(1,3)_{\\mathbb{C}}$, which remarkably decomposes into a direct sum of two independent $\\mathfrak{su}(2)_{\\mathbb{C}}$ algebras (isomorphic to $\\mathfrak{sl}(2,\\mathbb{C})$). This decomposition is achieved by defining new generators $A_i = \\frac{1}{2}(J_i + iK_i)$ and $B_i = \\frac{1}{2}(J_i - iK_i)$, where $J_i$ are rotation generators and $K_i$ are boost generators. These new generators satisfy the $\\mathfrak{su}(2)$ commutation relations independently: $[A_i, A_j] = i\\epsilon_{ijk}A_k$, $[B_i, B_j] = i\\epsilon_{ijk}B_k$, and $[A_i, B_j] = 0$. Consequently, the irreducible finite-dimensional representations of $\\mathfrak{so}(1,3)$ are classified by two non-negative half-integers $(j_1, j_2)$, corresponding to the spin of the two independent $\\mathfrak{su}(2)$ algebras. The dimension of such a representation is $(2j_1+1)(2j_2+1)$.

The Dirac field transforms under a spinor representation because it describes fundamental particles with intrinsic half-integer spin, such as electrons (spin 1/2). A scalar field, transforming under the $(0,0)$ representation, describes spin-0 particles (e.g., Higgs boson), while a vector field, transforming under the $(\\frac{1}{2},\\frac{1}{2})$ representation, describes spin-1 particles (e.g., photon). Neither scalar nor vector representations are suitable for particles with half-integer spin. Spinor representations are uniquely equipped to carry this intrinsic angular momentum. The Dirac field $\\psi$ is a 4-component object that transforms under the reducible representation $(\\frac{1}{2},0) \\oplus (0,\\frac{1}{2})$, which is a direct sum of two 2-component Weyl spinors. This specific combination allows the Dirac equation to remain covariant under Lorentz transformations and correctly describes the behavior of spin-1/2 fermions.

Spinor representations are fundamentally different from tensor representations (scalars, vectors, etc.) because they do not transform directly under the Lorentz transformation matrix $\\Lambda^\\mu_\\nu$. Instead, they transform under a matrix $S(\\Lambda)$ which is a representation of the Lorentz group acting on the spinor components. The most striking difference is their behavior under a $2\\pi$ rotation in spacetime: while tensors return to their original state, spinors acquire a negative sign, i.e., $S(R_{2\\pi}) = -I$. This "double-valuedness" is a hallmark of spinors. The natural emergence of a 4-component field in 4-dimensional spacetime for the Dirac spinor arises from the decomposition of the complexified Lie algebra into two $\\mathfrak{su}(2)$ factors. Each 2-component Weyl spinor, $\\psi_L$ (left-handed) and $\\psi_R$ (right-handed), corresponds to one of these $\\mathfrak{su}(2)$ factors, transforming under the $(\\frac{1}{2},0)$ and $(0,\\frac{1}{2})$ representations, respectively. The Dirac spinor $\\psi = \\begin{pmatrix} \\psi_L \\\\ \\psi_R \\end{pmatrix}$ is then a direct sum of these two, yielding a 4-component field, which is necessary to describe massive spin-1/2 particles that are not chiral eigenstates.

This brings us to the double cover of the Lorentz group, $SL(2,\\mathbb{C})$. The Lorentz group $SO(1,3)$ is not simply connected; its universal covering group is $SL(2,\\mathbb{C})$, the group of $2 \\times 2$ complex matrices with determinant 1. There is a 2-to-1 homomorphism from $SL(2,\\mathbb{C})$ to $SO(1,3)$, meaning that for every Lorentz transformation $\\Lambda \\in SO(1,3)$, there are two elements $\\pm A \\in SL(2,\\mathbb{C})$ that map to it. Spinors are not true representations of $SO(1,3)$ but rather of its double cover, $SL(2,\\mathbb{C})$. The irreducible representations of $SL(2,\\mathbb{C})$ are precisely the $(j_1, j_2)$ representations derived from the complexified Lie algebra. The fundamental representation of $SL(2,\\mathbb{C})$ is the 2-component Weyl spinor, corresponding to the $(\\frac{1}{2},0)$ representation (or $(0,\\frac{1}{2})$ depending on convention). The Dirac field, transforming under the $(\\frac{1}{2},0) \\oplus (0,\\frac{1}{2})$ representation of $SL(2,\\mathbb{C})$, thus naturally accommodates the spin-1/2 nature of fermions and their transformation properties under Lorentz boosts and rotations.
***
The geometric viewpoint provide a deeper understanding of the nature of the Dirac field and its components. In order to understand the 4-component nature of the Dirac field, we first need to understand the fields with different spins on the manifold in a unified way.

From the point of view of differential geometry, the different field is a section of a bundle over spacetime, i.e., these fields are mathematical objects in a multilinear space at different points of the manifold.

From the perspective of algebra, these different fields must be representations of the Lorentz group.

In summary, the bundle is associated with a representation of the Lorentz group. In more detail, the spinor bundle is a complex vector bundle associated with a spinor representation of the Lorentz group. The 4-component nature of the Dirac field arises from the structure of the spinor representation of the Lorentz group, which is irreducible and has 4 complex dimensions. This geometric viewpoint provides a deeper understanding of the Dirac field and its components, connecting the physics of spin-1/2 particles to the geometry and symmetry (algebra) of spacetime.
----------------
<HISTORY>The Kerr spacetime is a stationary, axisymmetric, and asymptotically flat solution to the Einstein field equations, describing the spacetime geometry around a rotating black hole. (... Describes the properties of Kerr spacetime ...)</HISTORY>
<QUERY>What is the free-fall path in Kerr spacetime?</QUERY>
<think>
The previous response was incomplete and lacked the initial analysis of the user query. The query "Kerr geodesics" is a request for information about the paths of objects moving in the spacetime around a rotating black hole (Kerr black hole). This involves concepts from general relativity, differential geometry, and potentially numerical methods. The knowledge domain can be classified as follows:

Primary Subject: Physics, Mathematics
Core Branches: General Relativity, Differential Geometry, Celestial Mechanics, Numerical Analysis
Specific Topics:
    Kerr Metric: Boyer-Lindquist coordinates, Event horizon, Ergosphere, Coordinate singularities.
    Geodesic Equation: Lagrangian formalism, Euler-Lagrange equations, Christoffel symbols.
    Constant of Motion: Energy, Angular Momentum, Carter Constant. Fundamental frequencies and Shape Parameters are also constant of motion.
    Orbit Classification: Bound orbits, Unbound orbits, Circular orbits, Spherical orbits, Plunging orbits, Scattering orbits.
    Astrophysical Applications: Accretion disks, Black hole shadows, Relativistic jets.
    Numerical Methods: Numerical integration of differential equations, Visualization techniques.

The query is broad, so the response strategies need to cover different aspects of Kerr geodesics, including the mathematical formalism, physical interpretation, astrophysical applications, and numerical methods. Different perspectives are possible:
1. Mathematical: Start with the Kerr metric and derive the geodesic equations.
2. Physical: Explain the effects of spacetime rotation on geodesic motion.
3. Astrophysical: Discuss the relevance of Kerr geodesics to astrophysical phenomena.
4. Computational: Outline numerical methods for solving the geodesic equations.

The task is to provide query variations and response strategies relating to Kerr geodesics.
</think>
Develop query variations and response strategies:
***
What is geodesic in the context of Kerr spacetime? Please introduce Kerr geodesic in depth.
***
The intricate dance of particles around a rotating black hole, described by the Kerr metric, reveals a remarkable underlying simplicity due to the existence of hidden symmetries. We begin with the Kerr metric in Boyer-Lindquist coordinates $(t, r, \\theta, \\phi)$:
$$
ds^2 = -\\frac{\\Delta}{\\Sigma}(dt - a\\sin^2\\theta d\\phi)^2 + \\frac{\\Sigma}{\\Delta}dr^2 + \\Sigma d\\theta^2 + \\frac{\\sin^2\\theta}{\\Sigma}((r^2+a^2)d\\phi - a dt)^2
$$
where $\\Sigma = r^2 + a^2\\cos^2\\theta$ and $\\Delta = r^2 - 2Mr + a^2$. Here, $M$ is the black hole mass and $a$ is its spin parameter ($0 \\le a \\le M$). For a massive particle, the Lagrangian is $\\mathcal{L} = \\frac{1}{2}g_{\\mu\\nu}\\dot{x}^\\mu\\dot{x}^\\nu$, where $\\dot{x}^\\mu = dx^\\mu/d\\tau$ and $\\tau$ is the proper time. The Euler-Lagrange equations $\\frac{d}{d\\tau}\\left(\\frac{\\partial\\mathcal{L}}{\\partial\\dot{x}^\\mu}\\right) - \\frac{\\partial\\mathcal{L}}{\\partial x^\\mu} = 0$ yield the geodesic equations. Due to the stationarity ($\\partial_t g_{\\mu\\nu} = 0$) and axisymmetry ($\\partial_\\phi g_{\\mu\\nu} = 0$) of the Kerr metric, two constants of motion immediately emerge:
1.  **Energy ($E$):** $p_t = \\frac{\\partial\\mathcal{L}}{\\partial\\dot{t}} = g_{tt}\\dot{t} + g_{t\\phi}\\dot{\\phi} = -E$.
2.  **Azimuthal Angular Momentum ($L_z$):** $p_\\phi = \\frac{\\partial\\mathcal{L}}{\\partial\\dot{\\phi}} = g_{\\phi t}\\dot{t} + g_{\\phi\\phi}\\dot{\\phi} = L_z$.
These can be explicitly written as $E = \\frac{\\Delta - a^2\\sin^2\\theta}{\\Sigma}\\dot{t} - \\frac{a\\sin^2\\theta(r^2+a^2-\\Delta)}{\\Sigma}\\dot{\\phi}$ and $L_z = \\frac{a\\sin^2\\theta(r^2+a^2-\\Delta)}{\\Sigma}\\dot{t} + \\frac{(r^2+a^2)^2\\sin^2\\theta - a^2\\Delta\\sin^4\\theta}{\\Sigma}\\dot{\\phi}$.
The third constant, the **Carter constant ($Q$)**, is a unique feature of the Kerr spacetime, arising from the separability of the Hamilton-Jacobi equation. It is related to the total angular momentum and is defined such that the equations of motion for $r$ and $\\theta$ decouple. The fourth constant is the **rest mass ($\\mu$)** of the particle, which is conserved along the geodesic, given by $g_{\\mu\\nu}\\dot{x}^\\mu\\dot{x}^\\nu = -\\mu^2$ (for timelike geodesics, $\\mu=0$ for null geodesics).

These four constants ($E, L_z, Q, \\mu$) allow the decoupling of the geodesic equations into separate equations for $r$ and $\\theta$ (and subsequently $t$ and $\\phi$). After some algebraic manipulation, the equations for radial and polar motion can be expressed as:
$$
\\Sigma^2\\dot{r}^2 = \\mathcal{R}(r) \\quad \\text{and} \\quad \\Sigma^2\\dot{\\theta}^2 = \\Theta(\\theta)
$$
where $\\mathcal{R}(r) = [E(r^2+a^2) - aL_z]^2 - \\Delta[\\mu^2 r^2 + Q]$ and $\\Theta(\\theta) = Q - \\cos^2\\theta(a^2\\mu^2 - L_z^2/\\sin^2\\theta)$. The functions $\\mathcal{R}(r)$ and $\\Theta(\\theta)$ act as effective potentials, defining the allowed regions of motion ($ \\mathcal{R}(r) \\ge 0 $ and $ \\Theta(\\theta) \\ge 0 $). To analyze the orbital properties, it is often convenient to introduce **Mino time** $d\\lambda = d\\tau/\\Sigma$. This transforms the equations into $(\\frac{dr}{d\\lambda})^2 = \\mathcal{R}(r)$ and $(\\frac{d\\theta}{d\\lambda})^2 = \\Theta(\\theta)$, simplifying their integration. The **Mino fundamental frequencies** $\\Upsilon_r, \\Upsilon_\\theta, \\Upsilon_\\phi$ represent the average rates of change of $r, \\theta, \\phi$ with respect to Mino time over one orbital period. These are related to the **Boyer-Lindquist frequencies** $\\Omega_r, \\Omega_\\theta, \\Omega_\\phi$ (which are rates with respect to BL time $t$) by $\\Omega_i = \\Upsilon_i / \\Upsilon_t$. Orbital geometry parameters like the semi-latus rectum ($p$), eccentricity ($e$), and inclination ($x = \\cos\\theta_{min}$) can be defined from $E, L_z, Q, \\mu$ and characterize the shape and orientation of the orbit. Based on the roots of $\\mathcal{R}(r)=0$, orbits are classified: **bound orbits** have two positive roots ($r_{min}, r_{max}$), leading to radial oscillations; **unbound orbits** have one positive root, either escaping to infinity or falling from infinity; **plunging trajectories** have no positive roots, falling directly into the black hole; and **scattering orbits** are unbound orbits that approach the black hole and then recede to infinity.

**Circular orbits** are a special case of bound orbits where $r$ is constant, requiring $\\mathcal{R}(r)=0$ and $\\mathcal{R}'(r)=0$ simultaneously. This yields specific values for $E$ and $L_z$ for a given $r$. **Spherical orbits** are those for which both $r$ and $\\theta$ are constant. This requires $\\mathcal{R}(r)=0, \\mathcal{R}'(r)=0$ and $\\Theta(\\theta)=0, \\Theta'(\\theta)=0$. The latter implies that $\\theta$ must be a fixed point of the polar motion, typically $\\theta=\\pi/2$ (equatorial) or $\\theta=0, \\pi$ (polar axis, only possible for $L_z=0$). **Equatorial geodesics** are characterized by $Q=0$ (or $\\theta=\\pi/2$ with $\\dot{\\theta}=0$), simplifying $\\Theta(\\theta)=0$. These orbits remain in the equatorial plane and are often the first to be studied due to their simpler dynamics. **Non-equatorial geodesics** ($Q>0$) exhibit oscillations in $\\theta$ between $\\theta_{min}$ and $\\theta_{max}$, tracing out a path that precesses around the black hole. The decoupled equations for $r$ and $\\theta$ are integrable, and their solutions can be expressed in terms of **elliptic integrals**, specifically for the radial motion (which involves a quartic polynomial in $r$) and polar motion (which involves a quadratic polynomial in $\\cos^2\\theta$). The **action-angle formalism** provides a powerful framework for analyzing these integrable systems. By transforming to action-angle variables $(J_r, J_\\theta, J_\\phi, w_r, w_\\theta, w_\\phi)$, the Hamiltonian becomes solely dependent on the action variables, $H(J_r, J_\\theta, J_\\phi)$. The frequencies of motion are then simply $\\Omega_i = \\partial H / \\partial J_i$. This formalism is crucial for understanding quasi-periodic motion and forms the basis for perturbation theory, such as in the study of gravitational waves emitted by extreme mass ratio inspirals (EMRIs).
***
Kerr spacetime, describing a rotating black hole, introduces profound physical effects absent in static Schwarzschild spacetime. The most striking is **frame-dragging**, or the Lense-Thirring effect, where the black hole's rotation twists and drags the very fabric of spacetime around itself. Consequently, free-falling particles and light rays are compelled to co-rotate with the black hole, even if their initial angular momentum relative to a distant observer is zero. This is a fundamental departure from Schwarzschild spacetime, where gravity acts purely radially, and there is no such "twisting" of spacetime. The ergosphere, a region outside the event horizon but within which frame-dragging is so intense that no object can remain stationary relative to infinity, is a direct manifestation of this effect, forcing all objects to co-rotate.

The rotation of a Kerr black hole significantly alters the **innermost stable circular orbit (ISCO)**. For particles orbiting prograde (co-rotating with the black hole), the ISCO radius decreases significantly, potentially reaching $r_{\\text{ISCO}} = GM/c^2$ for a maximally spinning black hole ($a=M$), compared to $r_{\\text{ISCO}} = 6GM/c^2$ in Schwarzschild spacetime. This is because frame-dragging effectively "assists" the particle, allowing it to orbit closer and more efficiently convert gravitational potential energy into radiation. Conversely, for retrograde orbits, the ISCO moves outward. Furthermore, Kerr geodesics enable unique **energy extraction mechanisms** like the Penrose process. Within the ergosphere, particles can possess negative energy as measured by a distant observer. A particle splitting into two inside the ergosphere can result in one fragment falling into the black hole with negative energy, allowing the other fragment to escape to infinity with more kinetic energy than the original particle, thereby extracting rotational energy from the black hole itself.
***
Discuss the astrophysical applications of Kerr geodesics, focusing on phenomena such as accretion disks around rotating black holes, the shapes of black hole shadows, and the dynamics of relativistic jets. Explain how the properties of Kerr geodesics are crucial for understanding observational signatures from these astrophysical systems and for testing general relativity in strong gravity regimes.
***
From a computational standpoint, outline the numerical methods used to solve the geodesic equations in Kerr spacetime. Describe how to implement these methods to trace the trajectories of particles and photons, and discuss techniques for visualizing Kerr geodesics, including orbit plots and embedding diagrams that illustrate the spacetime curvature and the paths of particles. You could also touch upon publicly available software or libraries that can be used for Kerr geodesic calculations.
----------------
<HISTORY></HISTORY>
<QUERY>
考虑矩阵
$$
A = \\begin{pmatrix} 2 & 1 \\\\ -1 & 2 \\end{pmatrix}.
$$
求矩阵 $A$ 的特征值和特征向量。
</QUERY>
<think>
The query asks for the eigenvalues and eigenvectors of a 2x2 matrix. This is a standard problem in linear algebra. The key concepts are:
Primary Subject: Mathematics
Core Branches: Linear Algebra
Specific Topics: Eigenvalues, Eigenvectors, Characteristic Polynomial, Matrix Diagonalization

The calculation involves the following steps:
1. Find the characteristic polynomial: $\\det(A - \\lambda I) = 0$, where $I$ is the identity matrix and $\lambda$ represents the eigenvalues.
2. Solve the characteristic equation to find the eigenvalues.
3. For each eigenvalue, solve the equation $(A - \\lambda I)v = 0$ to find the corresponding eigenvector $v$.

This query is clear and simple, so only one item is generated.
</think>
Develop query variations and response strategies:
***
First, calculate the characteristic polynomial by finding the determinant of $(A - \\lambda I)$. Then, solve for the eigenvalues $\\lambda$. For each $\\lambda$, solve the system of linear equations
$$
(A - \\lambda I)v = 0
$$ to find the corresponding eigenvector $v$.

# NOTES
These query variations or response strategies represent broader, deeper or other perspectives of the origin query, etc. Generally, generate about 3 items. If necessary, you can generate more for exploring the rich solution space. But the maximum number should not exceed 7. If the query is too narrow or the meaning is already so clear that no further items are available, caution should be exercised to avoid deviating from the original intent (generating fewer or even only 1 strategy).

These examples are ideal and simplified and are for reference only.

Strategies should be independent of each other, different from each other. This allows potential query variations or response strategies to be explored as much as possible.

No matter what language the input is your response should be in **English**.

Mathematical notation MUST use LaTeX inline ($...$) formats or display ($$...$$) formats.`;

const defaultPrompt = `<HISTORY>{{histories}}</HISTORY>
<QUERY>{{query}}</QUERY>`;

export const queryExtension = async ({
  chatBg,
  query,
  histories = [],
  model
}: {
  chatBg?: string;
  query: string;
  histories: ChatItemType[];
  model: string;
}): Promise<{
  rawQuery: string;
  extensionQueries: string[];
  model: string;
  inputTokens: number;
  outputTokens: number;
}> => {
  const systemFewShot = chatBg
    ? `user: 对话背景。
assistant: ${chatBg}
`
    : '';

  const modelData = getLLMModel(model);
  const filterHistories = await filterGPTMessageByMaxContext({
    messages: chats2GPTMessages({ messages: histories, reserveId: false }),
    maxContext: modelData.maxContext - 1000
  });

  const historyFewShot = filterHistories
    .map((item: any) => {
      const role = item.role;
      const content = item.content;
      if ((role === 'user' || role === 'assistant') && content) {
        if (typeof content === 'string') {
          return `${role}: ${content}`;
        } else {
          return `${role}: ${content.map((item: any) => (item.type === 'text' ? item.text : '')).join('\n')}`;
        }
      }
    })
    .filter(Boolean)
    .join('\n');
  const concatFewShot = `${systemFewShot}${historyFewShot}`.trim();

  const messages = [
    {
      role: 'system',
      content: defaultSystemPrompt
    },
    {
      role: 'user',
      content: replaceVariable(defaultPrompt, {
        query: `${query}`,
        histories: concatFewShot || 'null'
      })
    }
  ] as any;

  const { response: result } = await createChatCompletion({
    body: llmCompletionsBodyFormat(
      {
        stream: false,
        model: modelData.model,
        temperature: 0.1,
        messages
      },
      modelData
    )
  });

  let answer = result.choices?.[0]?.message?.content || '';
  if (!answer) {
    return {
      rawQuery: query,
      extensionQueries: [],
      model,
      inputTokens: 0,
      outputTokens: 0
    };
  }

  answer = answer.replace(/\\"/g, '"').replace(/\\/g, '\\\\');

  // Find the "Develop query variations and response strategies:" section
  const marker = "Develop query variations and response strategies:";
  const markerIndex = answer.indexOf(marker);
  
  if (markerIndex === -1) {
    addLog.warn('Query extension failed, marker not found', {
      answer
    });
    return {
      rawQuery: query,
      extensionQueries: [],
      model,
      inputTokens: 0,
      outputTokens: 0
    };
  }
  
  // Get the text after the marker and split by lines
  const itemsText = answer.substring(markerIndex + marker.length).trim();
  const items = itemsText.split('***')
    .map((line: string) => line.trim())
    .filter((line: string) => line.length > 0)
    .slice(0, 5); // Limit to 5 items
  
  return {
    rawQuery: query,
    extensionQueries: items,
    model,
    inputTokens: await countGptMessagesTokens(messages),
    outputTokens: await countPromptTokens(answer)
  };
}
